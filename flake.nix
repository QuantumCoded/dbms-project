{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = inputs:
    with inputs;
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
    in
    {
      devShells.x86_64-linux.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          nodejs
        ];
      };
    };
}
