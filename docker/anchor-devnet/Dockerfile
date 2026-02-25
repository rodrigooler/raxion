FROM rust:1.88-bookworm

ARG SOLANA_VERSION=v2.3.8
ARG ANCHOR_VERSION=v0.30.1

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    git \
    clang \
    cmake \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Anchor CLI pinned to project-compatible line.
# Do not use --locked here: newer Rust toolchains need updated transitive deps.
RUN cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag ${ANCHOR_VERSION}

# Solana / Agave CLI
RUN curl -sSfL "https://release.anza.xyz/${SOLANA_VERSION}/install" | sh
ENV PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

WORKDIR /work

CMD ["bash"]
