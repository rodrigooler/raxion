FROM rust:1.88-bookworm

ARG SOLANA_VERSION=v2.3.8
ARG ANCHOR_VERSION=0.30.1

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential pkg-config libssl-dev ca-certificates \
    curl git clang cmake protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# ponytail: cargo-binstall downloads pre-built binary, avoids 4GB+ RAM compilation
RUN curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash \
    && cargo binstall anchor-cli@${ANCHOR_VERSION} --no-confirm

RUN useradd --create-home --uid 1000 --shell /bin/bash raxion \
    && su - raxion -c "curl -sSfL https://release.anza.xyz/${SOLANA_VERSION}/install | sh" \
    && mkdir -p /work /home/raxion/.config/solana \
    && chown -R raxion:raxion /work /home/raxion/.config

ENV PATH="/usr/local/cargo/bin:/home/raxion/.local/share/solana/install/active_release/bin:${PATH}"

WORKDIR /work
USER raxion
CMD ["bash"]
