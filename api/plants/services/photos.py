import base64
from io import BytesIO

from PIL import Image, ImageOps

MAX_SIDE = 900
JPEG_QUALITY = 74


def photo_to_data_url(upload) -> str:
    img = Image.open(upload)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
