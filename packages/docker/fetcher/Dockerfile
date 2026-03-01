FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY fetcher.sh /usr/local/bin/fetcher.sh
RUN chmod +x /usr/local/bin/fetcher.sh

ENTRYPOINT ["/usr/local/bin/fetcher.sh"]
