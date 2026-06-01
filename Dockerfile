FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-mysql \
    libapache2-mod-php8.1 \
    && rm -rf /var/lib/apt/lists/*
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html
COPY <<EOF /etc/apache2/ports.conf
Listen \${PORT:-80}
EOF
RUN sed -i 's/:80/:${PORT:-80}/g' /etc/apache2/sites-enabled/000-default.conf
EXPOSE 80
CMD ["apache2ctl", "-D", "FOREGROUND"]
