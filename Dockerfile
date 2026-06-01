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
RUN rm -f /var/www/html/index.html
RUN echo "Listen 8080" > /etc/apache2/ports.conf
RUN sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' /etc/apache2/sites-enabled/000-default.conf
RUN echo "DirectoryIndex chokosfera.html" >> /etc/apache2/apache2.conf
EXPOSE 8080
CMD ["apache2ctl", "-D", "FOREGROUND"]
