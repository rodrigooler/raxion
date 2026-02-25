FROM rust:1.82-bookworm

ARG SOLANA_VERSION=v2.1.21
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

# Solana / Agave CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/${SOLANA_VERSION}/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Anchor CLI pinned to project-compatible line.
RUN cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag ${ANCHOR_VERSION} --locked

WORKDIR /work

CMD ["bash"]
