@echo off
nrfjprog --eraseall
nrfjprog --program s112_nrf52_7.3.0_softdevice.hex --verify
rem nrfjprog --program bootloader.hex --verify
nrfjprog --program EPD-nRF52.hex --verify
nrfjprog --reset
