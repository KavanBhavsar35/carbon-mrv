import bcrypt

# Fix passlib 1.7.4 compatibility with bcrypt 4.x/5.x
if not hasattr(bcrypt, "__about__"):
    class __about__:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = __about__
