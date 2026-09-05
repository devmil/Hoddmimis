"use strict";

const status = document.querySelector("[data-release-status]");

function formatBytes(bytes) {
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value >= 10 || unit === "B" ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

function architectureLabel(asset) {
  return asset.architecture === "arm64" ? "Apple silicon" : asset.architecture;
}

function isTui(asset) {
  return asset.variant === "tui";
}

function downloadTitle(asset) {
  if (isTui(asset)) {
    const titles = {
      "linux:rpm": "Linux TUI RPM package",
      "linux:tar.gz": "Portable Linux TUI archive",
      "macos:zip": "macOS TUI installer archive",
      "windows:zip": "Windows TUI installer archive",
    };
    return titles[`${asset.platform}:${asset.format}`] || "TUI package";
  }
  const format = asset.format;
  const titles = {
    AppImage: "Linux AppImage",
    "tar.gz": "Portable Linux archive",
    "pkg.tar.zst": "Arch Linux package",
    dmg: "macOS disk image",
    zip: "Windows portable ZIP",
    rpm: "RPM package",
    deb: "DEB package",
  };
  return titles[format] || `${format} package`;
}

function platformIcon(asset) {
  return { linux: "linux", macos: "apple", windows: "windows" }[asset.platform] || "package";
}

function formatBrands(asset) {
  const format = asset.format;
  const brands = {
    "pkg.tar.zst": ["archlinux"],
    rpm: ["fedora", "redhat", "suse"],
    deb: ["debian", "ubuntu"],
  };
  return brands[format] || [];
}

function installationLabel(asset) {
  if (isTui(asset)) {
    if (asset.format === "rpm") {
      return "DNF / Zypper";
    }
    return asset.platform === "linux" ? "Manual install" : "Installer included";
  }
  const format = asset.format;
  const labels = {
    AppImage: "Standalone",
    "tar.gz": "Manual install",
    "pkg.tar.zst": "pacman",
    dmg: "Drag to Applications",
    zip: "Extract and run",
    rpm: "DNF / Zypper",
    deb: "APT",
  };
  return labels[format] || "Package";
}

function distributionLabel(asset) {
  if (isTui(asset)) {
    const labels = {
      linux: "Qt-free terminal build for x86_64 Linux",
      macos: "Signed and notarized terminal build with an install script for Apple silicon macOS",
      windows: "Console build with a per-user installer for x86_64 Windows 10 1809 or later and Windows 11",
    };
    return labels[asset.platform] || "Terminal build";
  }
  const format = asset.format;
  const labels = {
    AppImage: "Runs on most Linux distributions",
    "tar.gz": "Works without a package manager",
    "pkg.tar.zst": "Common on Arch Linux, Manjaro, EndeavourOS, and Omarchy",
    dmg: "For Apple silicon macOS",
    zip: "For x86_64 Windows 10 1809 or later and Windows 11",
    rpm: "Common on Fedora, Red Hat Enterprise Linux, openSUSE, Rocky Linux, AlmaLinux, and CentOS Stream",
    deb: "Common on Debian, Ubuntu, Linux Mint, and Pop!_OS",
  };
  return labels[format] || "Linux";
}

function createAsset(asset) {
  const article = document.createElement("article");
  article.className = "release-asset";
  const header = document.createElement("div");
  header.className = "release-asset-header";
  const icon = document.createElement("span");
  icon.className = "release-asset-icon release-asset-icon--brands";
  icon.setAttribute("aria-hidden", "true");
  const brands = [platformIcon(asset), ...formatBrands(asset)];
  icon.classList.toggle("release-asset-icon--multi", brands.length > 1);
  for (const brand of brands) {
    const badge = document.createElement("span");
    badge.className = `release-brand-badge release-brand-badge--${brand}`;
    if (brand === "windows" || brand === "package") {
      const graphic = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      graphic.setAttribute("viewBox", "0 0 32 32");
      const symbol = document.createElementNS("http://www.w3.org/2000/svg", "use");
      symbol.setAttribute("href", `#release-icon-${brand}`);
      graphic.append(symbol);
      badge.append(graphic);
    } else {
      const logo = document.createElement("span");
      logo.className = `release-brand-logo release-brand-logo--${brand}`;
      badge.append(logo);
    }
    icon.append(badge);
  }
  const download = document.createElement("div");
  download.className = "release-asset-download";
  const link = document.createElement("a");
  link.href = asset.url;
  link.textContent = downloadTitle(asset);
  link.setAttribute(
    "aria-label",
    `Download Hoddmimis ${downloadTitle(asset)} for ${architectureLabel(asset)}, ${installationLabel(asset)}`,
  );
  const title = document.createElement("h4");
  title.className = "release-asset-title";
  title.append(link);
  const size = document.createElement("span");
  size.className = "release-asset-meta";
  size.textContent = `${architectureLabel(asset)} · ${asset.format} · ${installationLabel(asset)} · ${formatBytes(asset.bytes)}`;
  const compatibility = document.createElement("span");
  compatibility.className = "release-asset-compatibility";
  compatibility.textContent = distributionLabel(asset);
  header.append(icon, size);
  download.append(title, compatibility);
  const checksum = document.createElement("code");
  checksum.textContent = `SHA-256 ${asset.sha256}`;
  article.append(header, download, checksum);
  return article;
}

function createAssetGroup(titleText, descriptionText, releaseAssets) {
  const section = document.createElement("section");
  section.className = "release-asset-group";
  const heading = document.createElement("h3");
  heading.textContent = titleText;
  const description = document.createElement("p");
  description.className = "release-asset-group-description";
  description.textContent = descriptionText;
  const assets = document.createElement("div");
  assets.className = "release-assets";
  for (const asset of releaseAssets) {
    assets.append(createAsset(asset));
  }
  section.append(heading, description, assets);
  return section;
}

function createRelease(release, current) {
  const section = document.createElement("section");
  section.className = "release-entry";
  section.setAttribute("aria-labelledby", `release-${release.tag}`);
  const heading = document.createElement("h2");
  heading.id = `release-${release.tag}`;
  heading.textContent = `${release.version} · build ${release.build}`;
  const label = document.createElement("p");
  label.className = "release-channel";
  label.textContent = current ? `Current ${release.channel} release` : `${release.channel} release`;
  const fullAssets = release.assets.filter((asset) => !isTui(asset));
  const tuiAssets = release.assets.filter(isTui);
  section.append(heading, label);
  if (fullAssets.length > 0) {
    section.append(
      createAssetGroup(
        "Full releases",
        "Desktop application bundles. Native Linux packages also install the hoddmimis-tui command.",
        fullAssets,
      ),
    );
  }
  if (tuiAssets.length > 0) {
    section.append(
      createAssetGroup(
        "TUI releases",
        "Qt-free terminal packages for systems that do not need the desktop application.",
        tuiAssets,
      ),
    );
  }
  if (Array.isArray(release.notes) && release.notes.length > 0) {
    const notes = document.createElement("section");
    notes.className = "release-notes";
    const notesHeading = document.createElement("h3");
    notesHeading.textContent = "Release notes";
    const items = document.createElement("ul");
    for (const note of release.notes) {
      const item = document.createElement("li");
      item.textContent = note;
      items.append(item);
    }
    notes.append(notesHeading, items);
    section.append(notes);
  }
  return section;
}

function renderRelease(manifest) {
  if (!manifest.latest || !Array.isArray(manifest.releases)) {
    return;
  }
  const latest = manifest.latest;
  const heading = status.querySelector("h2");
  const development = status.querySelector("[data-development-status]");
  const history = status.querySelector("[data-release-history]");
  document.querySelector("[data-release-heading]").textContent = `Hoddmimis ${latest.version}`;
  document.querySelector("[data-release-intro]").textContent =
    `Build ${latest.build}. The five most recent releases remain available.`;
  heading.textContent = "Available releases";
  development.hidden = true;
  history.replaceChildren();
  for (const release of manifest.releases) {
    if (Array.isArray(release.assets)) {
      history.append(createRelease(release, release.tag === latest.tag));
    }
  }
  history.hidden = false;
}

if (status) {
  fetch("_data/releases.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`release manifest returned ${response.status}`);
      }
      return response.json();
    })
    .then(renderRelease)
    .catch(() => {
      status.querySelector("[data-manifest-error]").hidden = false;
    });
}
