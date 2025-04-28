# Tailscale Control

A Decky plugin to activate and deactivate Tailscale, while staying in Gaming mode. 

**[Note: Tailscale needs to be installed, this works only like a switch for the same.]**

## Pre-requisites

You will need to have Tailscale installed into your Steam Deck.

This plugin is a controller for turning Tailscale on and off.

Official install guide here: https://github.com/tailscale-dev/deck-tailscale

Once you have followed the steps and installed Tailscale using the above guide, it would auto-enable Tailscale at every boot, which might not necessarily be something everyone wants. This is where this plugin comes in.

### Why does the plugin not install Tailscale for me?

There are 2 main reasons: 
* The steps to install tailscale have changed for the Steam Deck and therefore could change in future, which brings the risk of corrupting files or not being able to remove files while updating (unless it is built by someone more proficient than me or is built by the official team).
* The guide created by @legowerewolf mentioned above provides a way by which your Tailscale install can persist across Steam updates.

So its a win-win.

### Features Addons:
- [Status Check](https://github.com/saumya-banthia/tailscale-control/pull/5)
- [Exit node Toggle](https://github.com/saumya-banthia/tailscale-control/issues/6)
- [Support for alt-installation option Nix added](https://github.com/saumya-banthia/tailscale-control/pull/9)
- [QoL Improvements: Custom login server and up flags](https://github.com/saumya-banthia/tailscale-control/issues/11)
- [Hostnames for Exit Nodes](https://github.com/saumya-banthia/tailscale-control/issues/14)
- [Custom Exit Node IP for Headscale Custom IP range Setup](https://github.com/saumya-banthia/tailscale-control/issues/20)

### Features To be added:
