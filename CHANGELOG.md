# Changelog

# 2.0.0
## Breaking changes
- Rename `domainRepository.mint` to `domainRepository.register`
- Rename `recordRepository.mint` to `recordRepository.create`
- Drop `setPrivateKey` in favor of `setSigningStrategy`

## New features
- Add signing strategy to generate transactions
  - Add support to Partisia SDK
- `approveMintFees` points directly to Meta Names contract
- `approveMintFees` accepts subscription years
- Wallet addresses can be strings
- Reduce gas cost per transaction

# 1.1.1
First stable version
