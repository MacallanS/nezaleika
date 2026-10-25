from django.contrib.auth import authenticate, login, logout
from django.http import Http404, HttpResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserProfile
from notifications.models import NotificationPrefs
from notifications.serializers import NotificationPrefsSerializer
from plants.services.photos import InvalidPhoto, decode_data_url, photo_digest, photo_to_data_url


def _profile(user) -> UserProfile:
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def avatar_url_for(user, request=None) -> str | None:
    profile = getattr(user, 'profile', None)
    if profile is None:
        profile = UserProfile.objects.filter(user=user).first()
    if not profile or not profile.avatar_data:
        return None
    path = f'/api/avatars/{user.pk}/{photo_digest(profile.avatar_data)}.jpg'
    return request.build_absolute_uri(path) if request else path


def user_payload(user, request=None, *, token: str | None = None) -> dict:
    data = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'avatar_url': avatar_url_for(user, request),
    }
    if token is not None:
        data['token'] = token
    return data


class CsrfView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active:
            return Response({'detail': 'Неверный логин или пароль.'}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(user_payload(user, request, token=token.key))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({'ok': True})


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        prefs = NotificationPrefs.objects.filter(user=user).first()
        payload = user_payload(user, request)
        payload['notification_prefs'] = NotificationPrefsSerializer(prefs).data if prefs else None
        return Response(payload)

    def patch(self, request):
        user = request.user
        if 'first_name' in request.data:
            name = str(request.data.get('first_name') or '').strip()
            if not name:
                return Response({'detail': 'Имя не может быть пустым.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(name) > 50:
                return Response({'detail': 'Слишком длинное имя.'}, status=status.HTTP_400_BAD_REQUEST)
            user.first_name = name
            user.save(update_fields=['first_name'])

        photo = request.FILES.get('avatar') or request.FILES.get('photo')
        if photo:
            profile = _profile(user)
            try:
                profile.avatar_data = photo_to_data_url(photo)
            except InvalidPhoto as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            profile.save(update_fields=['avatar_data', 'updated_at'])

        if request.data.get('clear_avatar') in (True, 'true', '1', 1):
            profile = _profile(user)
            profile.avatar_data = ''
            profile.save(update_fields=['avatar_data', 'updated_at'])

        return Response(user_payload(user, request))


class AvatarPhotoView(APIView):
    """Public content-addressed avatar so <img> works without auth headers."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk: int, digest: str):
        profile = UserProfile.objects.filter(user_id=pk).only('avatar_data').first()
        if not profile or not profile.avatar_data or photo_digest(profile.avatar_data) != digest:
            raise Http404
        content_type, body = decode_data_url(profile.avatar_data)
        response = HttpResponse(body, content_type=content_type)
        response['Cache-Control'] = 'public, max-age=31536000, immutable'
        return response


class NotificationPrefsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPrefs.objects.get_or_create(user=request.user)
        return Response(NotificationPrefsSerializer(prefs).data)

    def patch(self, request):
        prefs, _ = NotificationPrefs.objects.get_or_create(user=request.user)
        ser = NotificationPrefsSerializer(prefs, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
