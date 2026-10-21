import base64
import hashlib
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_SIDE = 900
JPEG_QUALITY = 74


class InvalidPhoto(ValueError):
    pass


def photo_digest(data_url: str) -> str:
    return hashlib.sha256(data_url.encode('ascii')).hexdigest()[:20]


def decode_data_url(data_url: str) -> tuple[str, bytes]:
    header, _, payload = data_url.partition(',')
    content_type = header.removeprefix('data:').split(';')[0] or 'image/jpeg'
    return content_type, base64.b64decode(payload)


def photo_to_data_url(upload) -> str:
    try:
        img = Image.open(upload)
        img = ImageOps.exif_transpose(img)
    except (UnidentifiedImageError, OSError) as e:
        raise InvalidPhoto('Не удалось прочитать изображение.') from e
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
