# syntax=docker/dockerfile:1.4

##### Frontend build ###########################################################
FROM node:22-slim AS frontend-builder

WORKDIR /corgi

ENV NODE_ENV=production \
    npm_config_loglevel=warn

COPY src/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
        npm ci; \
    else \
        npm install; \
    fi

COPY src ./
RUN npm run production

##### PHP release ##############################################################
FROM php:8.4-fpm AS release

LABEL maintainer="bcit-tlu" \
      description="CORGI application – PHP 8.4 / Laravel 11"

# Fail fast on errors in RUN blocks
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

ENV LANG=en_CA.UTF-8 \
    LANGUAGE=en_CA:en \
    LC_ALL=en_CA.UTF-8 \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /corgi

# ── System packages, locales, timezone, Composer ─────────────────────────────
# Kept as one layer so the apt cache is cleaned in the same step.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      mariadb-client \
      locales \
      unzip \
      zip \
      supervisor \
      libldap2-dev \
      libvips-dev \
      libfreetype6-dev \
      libjpeg62-turbo-dev \
      libpng-dev \
      libwebp-dev \
      curl \
 && ln -fs /usr/share/zoneinfo/America/Vancouver /etc/localtime \
 && dpkg-reconfigure --frontend noninteractive tzdata \
 && sed -i 's/# en_CA.UTF-8 UTF-8/en_CA.UTF-8 UTF-8/' /etc/locale.gen \
 && locale-gen \
 && rm -rf /var/lib/apt/lists/*

# Install Composer from the official multi-stage image (pinned major version)
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# ── PHP extensions ───────────────────────────────────────────────────────────
# Combined into a single layer to reduce image size.
RUN pecl install vips \
 && docker-php-ext-enable vips \
 && docker-php-ext-configure gd \
      --with-freetype \
      --with-webp \
      --with-jpeg \
 && docker-php-ext-configure ldap \
      --with-libdir=lib/$(uname -m)-linux-gnu/ \
 && docker-php-ext-install -j"$(nproc)" \
      mysqli \
      pdo_mysql \
      ldap \
      gd \
 && docker-php-source delete

# ── Composer dependencies ────────────────────────────────────────────────────
# Copy manifests first so this layer is cached when only app code changes.
COPY --link src/composer.json src/composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-scripts --no-autoloader --no-interaction --ansi

# ── Application files ────────────────────────────────────────────────────────
COPY --link src ./
COPY --link --from=frontend-builder /corgi/public ./public

RUN composer dump-autoload --optimize --no-interaction \
 && mkdir -p ./storage/app/public/images \
              ./storage/app/public/temp \
 && chmod -R 755 ./storage \
 && chmod -R 775 ./storage/logs ./storage/framework ./storage/app/public \
 && chown -R www-data:www-data \
      ./storage/logs \
      ./storage/framework \
      ./storage/app/public

COPY --link docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
