class ClawGuard < Formula
  desc "AI agent security companion — defend, audit, update"
  homepage "https://github.com/Goki602/ClawGuard"
  url "https://registry.npmjs.org/claw-guard/-/claw-guard-0.1.0.tgz"
  sha256 "PLACEHOLDER_UPDATE_AFTER_NPM_PUBLISH"
  license "MIT"

  depends_on "node@20"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claw-guard --version")
  end
end
