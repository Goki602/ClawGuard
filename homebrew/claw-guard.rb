class ClawGuard < Formula
  desc "AI agent security companion — defend, audit, update"
  homepage "https://github.com/Goki602/ClawGuard"
  url "https://registry.npmjs.org/@clawguard-sec/cli/-/cli-0.1.0.tgz"
  sha256 "71a408a167d37c6ac8b91e873ffeba5329fdd5532bfd18c998b0ecbff0c5e0bb"
  license "MIT"

  depends_on "node@20"

  def install
    system "npm", "install", *std_npm_args
    # std_npm_args includes --ignore-scripts which skips native module compilation.
    # better-sqlite3 requires node-gyp rebuild to produce the .node binding.
    cd libexec/"lib/node_modules/@clawguard-sec/cli/node_modules/better-sqlite3" do
      system "npm", "run", "build-release"
    end
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claw-guard --version")
  end
end
