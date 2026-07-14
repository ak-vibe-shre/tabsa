#!/bin/sh
# One-time bootstrap: obtains the first real Let's Encrypt certificate for nginx.
#
# Run this ONCE on the real server (requires tabsa.in / www.tabsa.in DNS already
# pointing at this machine, and ports 80+443 reachable from the internet):
#
#   ./nginx/init-letsencrypt.sh
#
# After this succeeds, the `certbot` service in docker-compose.yml renews the
# cert automatically every 12h (a no-op until it's within its renewal window) —
# no further manual steps needed.
set -e

domains="tabsa.in www.tabsa.in"
primary_domain="tabsa.in"
email="akshay.aradhya.sp@gmail.com"
rsa_key_size=4096
staging=0 # set to 1 to test against Let's Encrypt's staging server first (higher rate limits, untrusted cert)

domain_args=""
for domain in $domains; do
  domain_args="$domain_args -d $domain"
done

staging_arg=""
if [ "$staging" != "0" ]; then staging_arg="--staging"; fi

echo "### Creating a temporary self-signed certificate so nginx can start ..."
docker compose run --rm --entrypoint "/bin/sh -c '\
  mkdir -p /etc/letsencrypt/live/$primary_domain && \
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout /etc/letsencrypt/live/$primary_domain/privkey.pem \
    -out /etc/letsencrypt/live/$primary_domain/fullchain.pem \
    -subj /CN=localhost'" certbot

echo "### Starting nginx with the temporary certificate ..."
docker compose up -d --build nginx

echo "### Deleting the temporary certificate ..."
docker compose run --rm --entrypoint "/bin/sh -c '\
  rm -rf /etc/letsencrypt/live/$primary_domain && \
  rm -rf /etc/letsencrypt/archive/$primary_domain && \
  rm -rf /etc/letsencrypt/renewal/$primary_domain.conf'" certbot

echo "### Requesting the real certificate from Let's Encrypt ..."
docker compose run --rm --entrypoint "/bin/sh -c '\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --non-interactive --force-renewal'" certbot

echo "### Reloading nginx with the real certificate ..."
docker compose exec nginx nginx -s reload

echo "### Starting the rest of the stack (certbot's auto-renew loop, etc.) ..."
docker compose up -d --build

echo "### Done. https://$primary_domain should now be serving a real certificate."
echo "### From now on, a plain 'docker compose up -d --build' is all you need —"
echo "### the certificate persists in the certbot-conf volume and renews itself."
