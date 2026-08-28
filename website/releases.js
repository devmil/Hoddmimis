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

function platformLabel(asset) {
  const platform = asset.platform === "macos" ? "macOS" : "Linux";
  const architecture = asset.architecture === "arm64" ? "Apple Silicon" : asset.architecture;
  return `${platform} ${architecture}`;
}

function formatMark(format) {
  const marks = {
    AppImage: "APP",
    "tar.gz": "TGZ",
    "pkg.tar.zst": "PKG",
    dmg: "DMG",
    rpm: "RPM",
    deb: "DEB",
  };
  return marks[format] || format.slice(0, 3).toUpperCase();
}

function installationLabel(format) {
  const labels = {
    AppImage: "Standalone",
    "tar.gz": "Portable archive",
    "pkg.tar.zst": "pacman",
    dmg: "macOS disk image",
    rpm: "DNF / Zypper",
    deb: "APT",
  };
  return labels[format] || "Package";
}

function createAsset(asset) {
  const article = document.createElement("article");
  article.className = "release-asset";
  const icon = document.createElement("span");
  icon.className = "release-asset-icon";
  icon.setAttribute("aria-hidden", "true");
  const mark = document.createElement("span");
  mark.className = "release-format-mark";
  mark.textContent = formatMark(asset.format);
  icon.append(mark);
  const download = document.createElement("div");
  download.className = "release-asset-download";
  const link = document.createElement("a");
  link.href = asset.url;
  link.textContent = platformLabel(asset);
  link.setAttribute(
    "aria-label",
    `Download Hoddmimis for ${platformLabel(asset)} as ${asset.format}, ${installationLabel(asset.format)}`,
  );
  const size = document.createElement("span");
  size.textContent = `${asset.format} · ${installationLabel(asset.format)} · ${formatBytes(asset.bytes)}`;
  download.append(link, size);
  const checksum = document.createElement("code");
  checksum.textContent = `SHA-256 ${asset.sha256}`;
  article.append(icon, download, checksum);
  return article;
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
  const assets = document.createElement("div");
  assets.className = "release-assets";
  for (const asset of release.assets) {
    assets.append(createAsset(asset));
  }
  section.append(heading, label, assets);
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
