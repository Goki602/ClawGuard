import type { ExplainRisk } from "../types.js";

export const RULES_EN: Record<string, ExplainRisk> = {
	"BASH.RM_RISK": {
		title: "Potential mass deletion",
		what: "Deletes files and folders in bulk. Difficult to undo.",
		why: ["Targeting the wrong path could wipe your entire project."],
		check: ["Is the target path really correct?", "Do you have a backup or commit?"],
		alternatives: ["Check targets with `ls` first"],
		simple: {
			doing: "About to delete the {{target}} folder entirely",
			safe_points: ["Can be restored if a backup of this folder exists"],
			warning_points: ["Deleting the wrong folder is irreversible"],
			one_check: "Is the target folder correct?",
		},
	},
	"BASH.CHMOD_777": {
		title: "Granting full permissions to all files",
		what: "Grants read, write, and execute permissions to everyone for all files under the specified directory.",
		why: ["Granting more permissions than necessary is a security risk."],
		check: ["Is 777 really necessary?", "Is the target path correct?"],
		alternatives: ["Use minimal permissions (e.g. 755) instead"],
		simple: {
			doing: "About to grant full permissions to all files in the folder",
			safe_points: ["Permissions can be changed back later"],
			warning_points: ["Full permissions mean anyone can modify the files"],
			one_check: "Is 777 really necessary?",
		},
	},
	"BASH.GIT_PUSH_FORCE": {
		title: "Force-overwriting remote history",
		what: "Force-pushes to overwrite the remote repository's commit history.",
		why: ["Other team members' work may be lost."],
		check: ["Will this affect any team members?", "Is this the main/master branch?"],
		alternatives: ["Use `--force-with-lease` for safer operation"],
		simple: {
			doing: "About to force-overwrite the remote commit history",
			safe_points: ["If this is your own branch, the impact is limited"],
			warning_points: ["On a shared branch, other people's work will be lost"],
			one_check: "Is this branch used only by you?",
		},
	},
	"BASH.GIT_RESET_HARD": {
		title: "Irreversible Git history reset",
		what: "Discards all uncommitted changes and resets to a specified state.",
		why: ["All uncommitted work will be lost."],
		check: ["Are there any uncommitted changes?", "Have you stashed your work?"],
		alternatives: ["Use `git stash` to temporarily save changes before resetting"],
		simple: {
			doing: "About to discard all current work and revert to a previous state",
			safe_points: ["Committed changes will remain"],
			warning_points: ["Unsaved work will be permanently lost"],
			one_check: "Do you have any unsaved work?",
		},
	},
	"BASH.GIT_CLEAN_FDX": {
		title: "Bulk deletion of untracked files",
		what: "Deletes all files not tracked by Git (build artifacts, config files, etc.).",
		why: [".env and config files that are not in Git will also be deleted."],
		check: ["Did you do a dry run with `git clean -n` first?"],
		alternatives: ["Run `git clean -n` to preview what will be deleted"],
		simple: {
			doing: "About to delete all files not tracked by Git",
			safe_points: ["Files already tracked by Git will remain"],
			warning_points: ["Config files like .env may also be deleted"],
			one_check: "Have you reviewed the list of files to be deleted?",
		},
	},
	"BASH.PIPE_EXEC_001": {
		title: "Blind execution of remote script",
		what: "Downloads a script from a URL and executes it without reviewing its contents.",
		why: ["The content cannot be verified before execution", "Malicious code could go undetected"],
		check: ["Is the source URL a trusted official site?"],
		alternatives: ["Save with curl first, review the contents, then execute"],
		simple: {
			doing: "About to download and immediately execute a program from the internet",
			safe_points: ["Relatively safe if from an official site"],
			warning_points: ["Executing without reviewing the contents is dangerous"],
			one_check: "Is the download source a trusted site?",
		},
	},
	"BASH.PIPE_EXEC_002": {
		title: "Blind execution of remote script (wget)",
		what: "Downloads a script from a URL and executes it without reviewing its contents.",
		why: ["The content cannot be verified before execution"],
		check: ["Is the source URL a trusted official site?"],
		alternatives: ["Save with wget first, review the contents, then execute"],
		simple: {
			doing: "About to download and immediately execute a program from the internet",
			safe_points: ["Relatively safe if from an official site"],
			warning_points: ["Executing without reviewing the contents is dangerous"],
			one_check: "Is the download source a trusted site?",
		},
	},
	"BASH.ROOT_PATH_OP": {
		title: "Operation on root directory",
		what: "Attempting to move or copy files to the root directory.",
		why: ["This could corrupt system files."],
		check: ["Double-check that the path is correct"],
		alternatives: ["Specify the appropriate directory instead"],
		simple: {
			doing: "About to move files to the top-level system folder",
			safe_points: ["No issue if the path is correct"],
			warning_points: ["A wrong path could break the system"],
			one_check: "Is the destination path really correct?",
		},
	},
	"BASH.SSH_KEY_READ": {
		title: "Reading SSH keys",
		what: "Attempting to display the contents of SSH private keys or config files.",
		why: [
			"Leaked private keys could lead to unauthorized server access.",
			"Displayed keys may remain in logs or chat history.",
		],
		check: [
			"Do you really need to view the private key contents?",
			"Would the public key (.pub) suffice?",
		],
		alternatives: [
			"Use `ls ~/.ssh/` to just list files",
			"Use `ssh-keygen -l -f ~/.ssh/id_rsa` to check the key fingerprint only",
		],
		simple: {
			doing: "About to display the contents of an SSH key file",
			safe_points: ["Displaying a public key (.pub) is safe"],
			warning_points: ["Private keys shown on screen or in logs could be exploited"],
			one_check: "Is this a private key or a public key?",
		},
	},
	"BASH.ENV_FILE_READ": {
		title: "Reading environment file",
		what: "Attempting to display a .env file, which often contains passwords and API keys.",
		why: [
			"API keys and passwords may be displayed on screen or in logs.",
			"Displayed information may remain in chat history.",
		],
		check: [
			"Does the .env file contain API keys or passwords?",
			"Would checking a specific variable suffice?",
		],
		alternatives: [
			"Use `grep KEY_NAME .env` to check specific variables only",
			"Use `cat .env.example` to view the template instead",
		],
		simple: {
			doing: "About to display the contents of a .env (config) file",
			safe_points: [".env.example files don't contain secrets"],
			warning_points: ["API keys and passwords will be shown on screen"],
			one_check: "Does this file contain sensitive information?",
		},
	},
	"BASH.NPM_INSTALL": {
		title: "npm package install",
		what: "About to install a new npm package.",
		why: [
			"Malicious packages can execute scripts during installation.",
			"Typosquatting (fake packages with similar names) is a risk.",
		],
		check: [
			"Is the package name spelled correctly?",
			"Is this package trustworthy? (Check download count and maintainers)",
		],
		alternatives: [
			"Use `npm info <pkg>` to check package details first",
			"Use `npm install --ignore-scripts <pkg>` to install without running scripts",
		],
		simple: {
			doing: "About to install a new package (add-on)",
			safe_points: ["Well-known packages are generally safe"],
			warning_points: ["Watch out for fake packages"],
			one_check: "Is the package name correct?",
		},
	},
	"BASH.PIP_INSTALL": {
		title: "pip package install",
		what: "About to install a new Python package.",
		why: [
			"Malicious packages can execute code during installation.",
			"Typosquatting (fake packages with similar names) is a risk.",
		],
		check: [
			"Is the package name spelled correctly?",
			"Is this package trustworthy? (Check info on PyPI)",
		],
		alternatives: [
			"Use `pip show <pkg>` to check package details first",
			"Use `pip install --no-deps <pkg>` to install without dependencies",
		],
		simple: {
			doing: "About to install a new Python package",
			safe_points: ["Well-known packages are generally safe"],
			warning_points: ["Watch out for fake packages"],
			one_check: "Is the package name correct?",
		},
	},
	"BASH.GIT_CLONE": {
		title: "Repository clone",
		what: "About to clone (download) a Git repository.",
		why: [
			"Cloned repositories may contain malicious scripts (e.g. post-checkout hooks).",
			"May download a large amount of data.",
		],
		check: [
			"Is the clone source URL a trusted repository?",
			"Is the URL pointing to the intended repository?",
		],
		alternatives: [
			"Review the repository contents on GitHub first",
			"Use `git clone --depth 1` to fetch minimal history only",
		],
		simple: {
			doing: "About to download a Git repository (source code storage)",
			safe_points: ["Cloning from well-known repositories is generally safe"],
			warning_points: ["Be cautious with unknown repositories"],
			one_check: "Is the clone source URL correct?",
		},
	},
	"BASH.DOCKER_RUN_PRIV": {
		title: "Privileged Docker execution",
		what: "About to run a Docker container in privileged mode or with the host root directory mounted.",
		why: [
			"Privileged mode gives the container full control over the host OS, disabling isolation.",
			"Mounting / allows the container to access and modify all host files.",
			"A malicious container image could take over the host OS.",
		],
		check: [
			"Is privileged mode really necessary?",
			"Are the mounted paths minimal?",
			"Is the container image from a trusted source?",
		],
		alternatives: [
			"Add only necessary capabilities with `--cap-add`",
			"Mount only specific directories instead of the entire host",
			"Use the `--read-only` flag to make the container filesystem read-only",
		],
		simple: {
			doing: "About to run a Docker container with very high privileges",
			safe_points: ["May be acceptable for development with trusted images"],
			warning_points: ["Privileged mode completely removes security barriers"],
			one_check: "Is privileged mode really necessary?",
		},
	},
	"BASH.WGET_DOWNLOAD": {
		title: "wget download",
		what: "About to download a file with wget and save it to a specified location.",
		why: [
			"Downloaded files may contain malicious code.",
			"Existing important files may be overwritten depending on the save location.",
		],
		check: [
			"Is the download URL a trusted site?",
			"Is the save path correct? Will it overwrite existing files?",
			"Is HTTPS being used?",
		],
		alternatives: [
			"Review the URL contents in a browser first",
			"Check the file contents after downloading before using it",
		],
		simple: {
			doing: "About to download and save a file from the internet",
			safe_points: ["Downloads from official sites are generally safe"],
			warning_points: ["Downloaded file contents should be verified"],
			one_check: "Is the download source a trusted site?",
		},
	},
	"BASH.SSH_CONNECT": {
		title: "SSH connection",
		what: "About to establish an SSH connection to a remote server.",
		why: [
			"Commands may be executed on the remote server.",
			"If the destination is wrong, credentials may be sent to an unauthorized server.",
		],
		check: [
			"Is the hostname and username correct?",
			"Do you need to connect to this server?",
			"For first connections, can you verify the fingerprint?",
		],
		alternatives: [
			"Register connection details in `~/.ssh/config` for management",
			"Connect via a bastion/jump server for better security",
		],
		simple: {
			doing: "About to remotely connect to another server (computer)",
			safe_points: ["Connecting to known servers is generally safe"],
			warning_points: ["Verify the connection destination is correct"],
			one_check: "Is the destination server correct?",
		},
	},
	"BASH.NPM_AUDIT_FORCE": {
		title: "npm force fix",
		what: "About to forcefully change vulnerable package versions.",
		why: [
			"Major version changes may break your application.",
			"Dependencies may break, affecting other packages.",
		],
		check: [
			"Did you check the affected packages with `npm audit` first?",
			"Do you understand the impact of major version changes?",
			"Will you run tests after the changes?",
		],
		alternatives: [
			"Use `npm audit` to review vulnerabilities first",
			"Use `npm audit fix` (without --force) to fix only safe changes",
		],
		simple: {
			doing: "About to forcefully update packages with security issues to new versions",
			safe_points: ["Fixing security issues is a good thing"],
			warning_points: ["Major version changes may break your application"],
			one_check: "Can you run tests after the changes?",
		},
	},
	"BASH.NPM_GLOBAL": {
		title: "npm global install",
		what: "About to install an npm package system-wide.",
		why: [
			"Global installation affects the entire system and may impact other projects.",
			"Malicious packages can execute scripts with system-level permissions.",
		],
		check: [
			"Does this package really need to be global?",
			"Is the package name spelled correctly?",
			"Can you use `npx` instead?",
		],
		alternatives: [
			"Use `npx <pkg>` to run it temporarily",
			"Install as a project devDependency instead",
		],
		simple: {
			doing: "About to install a package for use across the entire PC",
			safe_points: ["Well-known CLI tools (eslint, typescript, etc.) are generally safe"],
			warning_points: ["Affects the entire PC, so be more careful than local installs"],
			one_check: "Does it really need to be installed globally?",
		},
	},
	"BASH.LONG_COMMAND": {
		title: "Long command execution",
		what: "About to execute a command longer than 200 characters via bash -c.",
		why: [
			"Long commands are hard to review and may contain hidden malicious code.",
			"May contain encoded payloads (hidden programs).",
		],
		check: [
			"Do you understand the full contents of this command?",
			"Are there any base64 or hex-encoded sections?",
			"Would it be safer to save this as a script file and execute it?",
		],
		alternatives: [
			"Write the command to a shell script file, review it, then execute",
			"Split the long one-liner into multiple shorter commands",
		],
		simple: {
			doing: "About to execute a very long command all at once",
			safe_points: ["Build commands can be long but safe"],
			warning_points: ["Malicious code can be easily hidden in long commands"],
			one_check: "Do you understand the full contents of this command?",
		},
	},
	"BASH.SCP_SEND": {
		title: "Remote file transfer",
		what: "About to send files to a remote server.",
		why: [
			"Sensitive files (private keys, .env, etc.) may be sent externally.",
			"If the destination is wrong, data will be leaked.",
			"Sent data cannot be recalled.",
		],
		check: [
			"Is the destination server correct?",
			"Do the files contain any sensitive information?",
			"Is this file transfer really necessary?",
		],
		alternatives: [
			"Review the file contents before sending",
			"Encrypt sensitive files before sending",
			"Use managed methods like GitHub or cloud storage to share files",
		],
		simple: {
			doing: "About to send files to another server (computer)",
			safe_points: ["Sending to your own managed server is generally safe"],
			warning_points: ["Sent files cannot be recalled. Watch for sensitive data leaks"],
			one_check: "Are the destination server and files correct?",
		},
	},
	"BASH.BREW_INSTALL": {
		title: "brew install",
		what: "About to install a package with Homebrew.",
		why: [
			"Installing from unofficial taps (external repos) may introduce unverified software.",
			"Build scripts may be executed during installation.",
		],
		check: [
			"Is the package name correct?",
			"Is it being installed from the official Homebrew formula?",
			"Is an unofficial tap (external repo) being used?",
		],
		alternatives: [
			"Use `brew info <pkg>` to check package details first",
			"Use `brew search <pkg>` to verify the correct name",
		],
		simple: {
			doing: "About to install software using Homebrew (macOS package manager)",
			safe_points: ["Official formulas are generally safe"],
			warning_points: ["Be cautious with unofficial taps"],
			one_check: "Is the package name correct?",
		},
	},
	"BASH.YARN_ADD": {
		title: "yarn add",
		what: "About to install a new package with yarn.",
		why: [
			"Malicious packages can execute scripts during installation.",
			"Typosquatting (fake packages with similar names) is a risk.",
		],
		check: [
			"Is the package name spelled correctly?",
			"Is this package trustworthy? (Check download count and maintainers)",
		],
		alternatives: [
			"Use `npm info <pkg>` to check package details first",
			"Use `yarn add --ignore-scripts <pkg>` to install without running scripts",
		],
		simple: {
			doing: "About to install a new package using yarn (package manager)",
			safe_points: ["Well-known packages are generally safe"],
			warning_points: ["Watch out for fake packages"],
			one_check: "Is the package name correct?",
		},
	},
	"BASH.ENV_DUMP": {
		title: "Environment variable dump",
		what: "About to display all environment variables.",
		why: [
			"Environment variables may contain API keys, passwords, and other secrets.",
			"Displayed information may remain in logs or chat history.",
		],
		check: [
			"Do you really need the full list of environment variables?",
			"Would checking a specific variable suffice?",
			"Is it okay if sensitive information remains in logs?",
		],
		alternatives: [
			"Use `echo $VARIABLE_NAME` to check specific variables only",
			"Use `env | grep KEY_NAME` to filter for needed variables",
		],
		simple: {
			doing: "About to display all environment variables (settings) on the PC",
			safe_points: ["Viewing environment variables won't break the system"],
			warning_points: ["Passwords and API keys may be displayed on screen or in logs"],
			one_check: "Would checking a specific variable suffice?",
		},
	},
	"BASH.CURL_DOWNLOAD": {
		title: "curl download",
		what: "About to download and save a file using curl.",
		why: [
			"Downloaded files may contain malicious code.",
			"Existing files may be overwritten depending on the save location.",
		],
		check: [
			"Is the download URL a trusted site?",
			"Is the save path correct?",
			"Is HTTPS being used?",
		],
		alternatives: [
			"Review the URL contents in a browser first",
			"Check the file contents after downloading before using it",
		],
		simple: {
			doing: "About to download and save a file from the internet",
			safe_points: ["Downloads from official sites are generally safe"],
			warning_points: ["Downloaded file contents should be verified"],
			one_check: "Is the download source a trusted site?",
		},
	},
	"BASH.APT_INSTALL": {
		title: "OS package install",
		what: "About to install software using the OS package manager.",
		why: [
			"System-level packages affect the entire OS.",
			"Non-official repositories may introduce unverified software.",
		],
		check: [
			"Is the package name correct?",
			"Is it being installed from the official repository?",
			"Is this package really necessary?",
		],
		alternatives: [
			"Use `apt show <pkg>` / `dnf info <pkg>` to check package details first",
			"Install inside a Docker container to avoid impacting the host OS",
		],
		simple: {
			doing: "About to install software on the OS (Linux)",
			safe_points: ["Official repositories are generally safe"],
			warning_points: ["Affects the entire system, so be careful"],
			one_check: "Is this package really necessary?",
		},
	},
	"SKILL.NEW_INSTALL": {
		title: "New skill installation",
		what: "About to install a new skill (AI agent extension).",
		why: [
			"Skills grant new permissions to the agent; malicious skills could leak data.",
			"Unverified skills may contain security vulnerabilities.",
		],
		check: [
			"Is the skill author trustworthy?",
			"Are the requested permissions appropriate?",
			"Have you checked reviews or ratings for this skill?",
		],
		alternatives: ["Review the skill's source code first", "Try it in a sandbox environment first"],
		simple: {
			doing: "About to add a new capability (skill) to the AI agent",
			safe_points: ["Skills from official or well-known authors are generally safe"],
			warning_points: ["Skills grant new permissions to the agent"],
			one_check: "Is the skill author trustworthy?",
		},
	},
	"SKILL.UPDATE_EXPAND": {
		title: "Skill permission expansion",
		what: "A skill update is requesting new permissions that weren't previously granted.",
		why: [
			"Dangerous permissions may be added under the guise of an update.",
			"This pattern is used in supply-chain attacks (exploiting trusted software).",
			"Permission expansion increases the risk of data leaks and system damage.",
		],
		check: [
			"What permissions are being added? Are they justified?",
			"Why does this update require new permissions?",
			"Have you reviewed the update's release notes?",
		],
		alternatives: [
			"Continue using the current version",
			"Review release notes and changelogs before updating",
			"Check the skill's source code diff before updating",
		],
		simple: {
			doing: "A skill (AI extension) update is requesting new permissions it didn't have before",
			safe_points: ["Legitimate feature additions may genuinely require new permissions"],
			warning_points: ["Permission expansion is a common attack technique"],
			one_check: "Are the added permissions justified?",
		},
	},
};
