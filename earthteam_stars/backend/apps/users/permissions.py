from rest_framework.permissions import BasePermission


class IsReporter(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'reporter'


class IsVerifier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'verifier'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsVerifierOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('verifier', 'admin')
