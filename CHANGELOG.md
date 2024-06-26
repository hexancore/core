# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.16.2] - 2024-06-29

### Fixed

- added @fastify/static back

## [0.16.1] - 2024-06-28

### Changed

- reworked AppConfig methods
- reworked Http

## [0.16.0] - 2024-06-27

### Added

- added access methods to AppConfig
- added better support for multi-app monorepo config directory structure

### Changed

- bump @hexancore/common to 0.15

## [0.15.4] - 2024-06-24

### Fixed

- fixed AggregateRootRepositoryProxyHandler `get` trap when checking `then` in NestJs DI

## [0.15.3] - 2024-06-23

### Added

- @InjectAggregateRootRepository decorator with lazy repository instancing

## [0.15.2] - 2024-06-19

### Fixed

- fixed wrong .npmignore filters

## [0.15.1] - 2024-06-19

### Changed

- reworked UncaughtErrorCatcher

### Removed

- removed debug mode from create response body from AppError

### Fixed

- added default Content-Type = json in last HttpOrderedInterceptorGroup.

## [0.15.0] 2024-06-16

### Changed

- update deps
- reworked http part

### Removed

- removed redis module(@hexancore/cloud now supports redis intergation)

## [0.14.0] - 2024-02-11

### Changed

- module in places directly in `src/`

## [0.13.2] - 2024-02-01

## [0.13.1] - 2024-01-25

### Changed

- updated dep @hexancore/common to 0.13.2

## [0.13.0] - 2024-01-25

### Changed

- updated dep @hexancore/common to 0.13.0

## [0.12.6] - 2024-01-07

### Added

- AppConfig - ConfigService + SecretsService in one
- SimpleAccountContext - for simplify integration testing.
- autoload module repositories metadata

### Fixed

- AggregateRoot without collections bug

## [0.12.5] - 2023-12-26

### Added

- HcModule - global app module with all common app stuff included
- HcApplicationModule - global Application layer module with CQRS stuff
- HcInfraMemoryDomainModule - to define App module domain infrastructure layer
- HcInfraMemoryDomainModule - register basic inmemory domain entities persister

### Changed

- refactor DDD entity to epic generic DDD Entity stuff :)
- HcAppModuleMeta - to extract module metadata like name from file path
- moved to swc build

## [0.12.4] - 2023-12-06

### Fixed

- github actions

## 0.12.0 - 2023-08-01

### Added

- started changelog file
- added app redis cluster connection module
- added HcHttpModule
- added HttpOrderedInterceptorGroup

### Changed

- enchanted http test mocking part
-

## [0.10.2] - 2023-08-01

### Added

- many changes

[unreleased] https://github.com/hexancore/core/compare/0.16.2...HEAD   
[0.16.2] https://github.com/hexancore/core/compare/0.16.1...0.16.2   
[0.16.1] https://github.com/hexancore/core/compare/0.16.0...0.16.1   
[0.16.0] https://github.com/hexancore/core/compare/0.15.4...0.16.0   
[0.15.4] https://github.com/hexancore/core/compare/0.15.3...0.15.4  
[0.15.3] https://github.com/hexancore/core/compare/0.15.2...0.15.3  
[0.15.2] https://github.com/hexancore/core/compare/0.15.1...0.15.2  
[0.15.1] https://github.com/hexancore/core/compare/0.15.0...0.15.1  
[0.15.0] https://github.com/hexancore/core/compare/0.14.0...0.15.0  
[0.14.0] https://github.com/hexancore/core/compare/0.13.2...0.14.0  
[0.13.2] https://github.com/hexancore/core/compare/0.13.1...0.13.2  
[0.13.1] https://github.com/hexancore/core/compare/0.13.0...0.13.1  
[0.13.0] https://github.com/hexancore/core/compare/0.12.6...0.13.0  
[0.12.6] https://github.com/hexancore/core/compare/0.12.5...0.12.6  
[0.12.5] https://github.com/hexancore/core/compare/0.12.4...0.12.5  
[0.12.4] https://github.com/hexancore/core/compare/0.12.0...0.12.5  
[0.12.0] https://github.com/hexancore/core/compare/0.10.2...0.12.0  
[0.10.2] https://github.com/hexancore/core/compare/0.10.2
