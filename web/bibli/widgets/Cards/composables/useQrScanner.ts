import { nextTick, onBeforeUnmount, onDeactivated, ref } from "vue";

/**
 * Камера-сканер QR для учёта карт.
 * BarcodeDetector где есть, иначе jsQR. Антидребезг COOLDOWN_MS.
 * Мобилка: fallback constraints, session-token против гонок, downscale для jsQR,
 * torch / смена камеры, понятные ошибки HTTPS / permission.
 */
const COOLDOWN_MS = 1800;
const SCAN_INTERVAL_MS = 280;
const JSQR_MAX_EDGE = 720;

export function useQrScanner() {
  const videoRef = ref<HTMLVideoElement | null>(null);
  const active = ref(false);
  const loading = ref(false);
  const error = ref("");
  const errorHint = ref("");
  const nativeSupported = ref(false);
  const torchSupported = ref(false);
  const torchOn = ref(false);
  const facingMode = ref<"environment" | "user">("environment");
  const canSwitchCamera = ref(false);

  let stream: MediaStream | null = null;
  let detector: any = null;
  let loopTimeout: number | null = null;
  let onDecode: ((value: string) => void) | null = null;
  let lastValue = "";
  let lastValueAt = 0;
  let fallbackCanvas: HTMLCanvasElement | null = null;
  let fallbackCtx: CanvasRenderingContext2D | null = null;
  let sessionId = 0;
  let startSeq = 0;

  const isInsecureOrigin = () => {
    if (typeof window === "undefined") return false;
    if (window.isSecureContext) return false;
    const host = String(window.location.hostname || "").toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]";
  };

  const detectQrSupport = () =>
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const createDetector = () => {
    if (!detectQrSupport()) return null;
    try {
      const Ctor = (window as any).BarcodeDetector;
      return new Ctor({ formats: ["qr_code"] });
    } catch {
      return null;
    }
  };

  const ensureFallbackCanvas = () => {
    if (typeof document === "undefined" || fallbackCanvas) return;
    fallbackCanvas = document.createElement("canvas");
    fallbackCtx = fallbackCanvas.getContext("2d", { willReadFrequently: true });
  };

  const decodeWithJsQr = async (videoEl: HTMLVideoElement): Promise<string | null> => {
    ensureFallbackCanvas();
    if (!fallbackCanvas || !fallbackCtx) return null;

    const srcW = videoEl.videoWidth || 0;
    const srcH = videoEl.videoHeight || 0;
    if (!srcW || !srcH) return null;

    const scale = Math.min(1, JSQR_MAX_EDGE / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    if (fallbackCanvas.width !== width) fallbackCanvas.width = width;
    if (fallbackCanvas.height !== height) fallbackCanvas.height = height;

    fallbackCtx.drawImage(videoEl, 0, 0, width, height);
    const imageData = fallbackCtx.getImageData(0, 0, width, height);
    const { default: jsQR } = await import("jsqr");
    const result = jsQR(imageData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data || null;
  };

  const stopLoop = () => {
    if (loopTimeout !== null && typeof window !== "undefined") {
      window.clearTimeout(loopTimeout);
    }
    loopTimeout = null;
  };

  const scheduleScan = (sid: number) => {
    if (typeof window === "undefined") return;
    if (sid !== sessionId) return;
    stopLoop();
    loopTimeout = window.setTimeout(() => {
      void scanFrame(sid);
    }, SCAN_INTERVAL_MS);
  };

  const emit = (value: string) => {
    const now = Date.now();
    if (value === lastValue && now - lastValueAt < COOLDOWN_MS) return;
    lastValue = value;
    lastValueAt = now;
    onDecode?.(value);
  };

  const scanFrame = async (sid: number) => {
    if (sid !== sessionId) return;
    const videoEl = videoRef.value;
    if (!videoEl || !stream) return;

    try {
      if (videoEl.readyState < 2) {
        scheduleScan(sid);
        return;
      }

      let value: string | null = null;
      if (detector) {
        const codes = await detector.detect(videoEl);
        if (sid !== sessionId) return;
        value = Array.isArray(codes) && codes.length > 0 ? codes[0]?.rawValue || null : null;
      } else {
        value = await decodeWithJsQr(videoEl);
        if (sid !== sessionId) return;
      }

      if (value) emit(value);
    } catch {
      void 0;
    }
    scheduleScan(sid);
  };

  const isCameraApiSupported = () =>
    typeof navigator !== "undefined" &&
    Boolean(
      navigator.mediaDevices?.getUserMedia ||
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia,
    );

  const requestUserMedia = (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    if (navigator.mediaDevices?.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(constraints);
    }
    const legacy =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia;
    if (!legacy) return Promise.reject(new Error("getUserMedia не поддерживается"));
    return new Promise((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
  };

  const waitForVideoEl = async (timeoutMs = 1500): Promise<HTMLVideoElement | null> => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (videoRef.value) return videoRef.value;
      await nextTick();
      await new Promise((r) => setTimeout(r, 16));
    }
    return videoRef.value;
  };

  const attachStream = async (mediaStream: MediaStream) => {
    const videoEl = await waitForVideoEl();
    if (!videoEl) throw new Error("video-element-missing");
    videoEl.setAttribute("playsinline", "true");
    videoEl.setAttribute("webkit-playsinline", "true");
    videoEl.muted = true;
    videoEl.srcObject = mediaStream;
    try {
      await videoEl.play();
    } catch {
      await new Promise<void>((resolve) => {
        const onReady = async () => {
          videoEl.removeEventListener("loadedmetadata", onReady);
          videoEl.removeEventListener("canplay", onReady);
          try {
            await videoEl.play();
          } catch {
            void 0;
          }
          resolve();
        };
        videoEl.addEventListener("loadedmetadata", onReady, { once: true });
        videoEl.addEventListener("canplay", onReady, { once: true });
      });
    }
  };

  const updateTorchCapability = () => {
    const track = stream?.getVideoTracks()?.[0];
    const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
    torchSupported.value = Boolean(caps?.torch);
    if (!torchSupported.value) torchOn.value = false;
  };

  const refreshCameraList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      canSwitchCamera.value = cams.length > 1;
    } catch {
      canSwitchCamera.value = false;
    }
  };

  const mapMediaError = (e: any): { message: string; hint: string } => {
    const name = e?.name || "";
    if (isInsecureOrigin()) {
      return {
        message: "Браузер блокирует камеру на этом адресе (нужен HTTPS).",
        hint: "Откройте сайт по https:// или 127.0.0.1, затем нажмите «Попробовать ещё раз».",
      };
    }
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        message: "Доступ к камере запрещён.",
        hint: "Разрешите камеру в настройках браузера и нажмите «Попробовать ещё раз».",
      };
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        message: "Камера не найдена.",
        hint: "Подключите камеру и нажмите «Попробовать ещё раз».",
      };
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return {
        message: "Камера занята другим приложением.",
        hint: "Закройте другие приложения с камерой и попробуйте снова.",
      };
    }
    if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
      return {
        message: "Не удалось подобрать камеру.",
        hint: "Нажмите «Сменить камеру» или «Попробовать ещё раз».",
      };
    }
    if (e?.message === "video-element-missing") {
      return {
        message: "Не удалось открыть превью камеры.",
        hint: "Нажмите «Попробовать ещё раз».",
      };
    }
    return {
      message: "Не удалось открыть камеру.",
      hint: "Нажмите «Попробовать ещё раз».",
    };
  };

  const openStream = async (mode: "environment" | "user") => {
    const attempts: MediaStreamConstraints[] = [
      {
        audio: false,
        video: {
          facingMode: { exact: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      { audio: false, video: { facingMode: mode } },
      { audio: false, video: true },
    ];

    let lastErr: unknown = null;
    for (const constraints of attempts) {
      try {
        return await requestUserMedia(constraints);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("getUserMedia failed");
  };

  const releaseStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          if (torchOn.value) {
            void track.applyConstraints?.({ advanced: [{ torch: false }] as any }).catch(() => {});
          }
        } catch {
          void 0;
        }
        track.stop();
      });
      stream = null;
    }
    if (videoRef.value) videoRef.value.srcObject = null;
    torchSupported.value = false;
    torchOn.value = false;
  };

  /** Запустить камеру и непрерывный скан. cb — на каждый новый распознанный код. */
  const start = async (cb: (value: string) => void) => {
    if (loading.value) return;
    const seq = ++startSeq;
    error.value = "";
    errorHint.value = "";

    if (!isCameraApiSupported()) {
      if (isInsecureOrigin()) {
        error.value = "Браузер не даёт live-камеру по HTTP в локальной сети.";
        errorHint.value =
          "Нужен https:// или 127.0.0.1 — иначе камера недоступна.";
      } else {
        error.value = "Камера не поддерживается этим устройством или браузером";
        errorHint.value = "Откройте раздел с устройства с рабочей камерой.";
      }
      return;
    }

    loading.value = true;
    onDecode = cb;
    lastValue = "";
    lastValueAt = 0;
    stopLoop();
    releaseStream();
    active.value = false;

    try {
      stream = await openStream(facingMode.value);
      if (seq !== startSeq) {
        releaseStream();
        return;
      }
      await attachStream(stream);
      if (seq !== startSeq) {
        releaseStream();
        return;
      }

      try {
        const track = stream.getVideoTracks()[0];
        await track?.applyConstraints?.({ advanced: [{ torch: false }] as any });
      } catch {
        void 0;
      }

      detector = createDetector();
      nativeSupported.value = detector !== null;
      updateTorchCapability();
      await refreshCameraList();

      sessionId += 1;
      const sid = sessionId;
      active.value = true;
      scheduleScan(sid);
    } catch (e: any) {
      if (seq !== startSeq) return;
      const mapped = mapMediaError(e);
      error.value = mapped.message;
      errorHint.value = mapped.hint;
      stop();
    } finally {
      if (seq === startSeq) loading.value = false;
    }
  };

  const stop = () => {
    startSeq += 1;
    sessionId += 1;
    stopLoop();
    releaseStream();
    detector = null;
    onDecode = null;
    active.value = false;
    loading.value = false;
  };

  const resetLast = () => {
    lastValue = "";
    lastValueAt = 0;
  };

  const toggleTorch = async () => {
    if (!torchSupported.value || !stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn.value;
      await track.applyConstraints({ advanced: [{ torch: next }] as any });
      torchOn.value = next;
    } catch {
      torchSupported.value = false;
      torchOn.value = false;
    }
  };

  const switchCamera = async () => {
    if (loading.value) return;
    const cb = onDecode;
    facingMode.value = facingMode.value === "environment" ? "user" : "environment";
    if (!cb) return;
    await start(cb);
  };

  onDeactivated(stop);
  onBeforeUnmount(stop);

  return {
    videoRef,
    active,
    loading,
    error,
    errorHint,
    nativeSupported,
    torchSupported,
    torchOn,
    canSwitchCamera,
    facingMode,
    start,
    stop,
    resetLast,
    toggleTorch,
    switchCamera,
  };
}
