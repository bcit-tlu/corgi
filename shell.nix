{ pkgs ? import <nixpkgs> {} }:

let
  tools = [
    pkgs.nodejs_24
    pkgs.git
    pkgs.jq
    pkgs.nixd
  ];
in
pkgs.mkShell {
  name = "corgi-development";

  buildInputs = with pkgs; tools;

  # Optional: add custom shell hooks or environment variables here
  # shellHook = ''
  #   echo "Welcome to the Corgi dev environment!"
  # '';
}
