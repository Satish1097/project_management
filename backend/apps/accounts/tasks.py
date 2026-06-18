from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_password_reset_email(email: str, reset_url: str) -> None:
    send_mail(
        subject="Reset your password",
        message=(
            "Use the link below to reset your password:\n\n"
            f"{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


# @shared_task
# def send_project_invite_email(
#     email: str,
#     signup_url: str,
#     project_name: str,
#     organization_name: str,
# ) -> None:
#     send_mail(
#         subject=f"You're invited to join {project_name}",
#         message=(
#             f"You've been invited to join {project_name} in {organization_name}.\n\n"
#             "Use the link below to create your account and accept the invitation:\n\n"
#             f"{signup_url}\n\n"
#             "This invitation link expires soon."
#         ),
#         from_email=settings.DEFAULT_FROM_EMAIL,
#         recipient_list=[email],
#         fail_silently=False,
#     )


from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

@shared_task
def send_project_invite_email(
    email: str,
    signup_url: str,
    project_name: str,
    organization_name: str,
) -> None:

    html_content = render_to_string(
        "emails/project_invitation.html",
        {
            "project_name": project_name,
            "organization_name": organization_name,
            "signup_url": signup_url,
        },
    )

    msg = EmailMultiAlternatives(
        subject=f"You're invited to join {project_name}",
        body=f"Accept invitation: {signup_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )

    msg.attach_alternative(html_content, "text/html")
    msg.send()

@shared_task
def send_project_added_notification_email(
    email: str,
    project_name: str,
    organization_name: str,
) -> None:
    send_mail(
        subject=f"You were added to {project_name}",
        message=(
            f"You have been added to {project_name} in {organization_name}.\n\n"
            "Sign in to view the project."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
