const chrome = typeof browser !== "undefined" ? browser : chrome;

// ─── Site Extractors ──────────────────────────────────────────────────────────

function extractLinkedIn() {
  const position =
    document
      .querySelector(".job-details-jobs-unified-top-card__job-title")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-unified-top-card__job-title")
      ?.textContent?.trim() ||
    document.querySelector("h1.t-24")?.textContent?.trim() ||
    document
      .querySelector(".job-details-jobs-unified-top-card h1")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-details-top-card__job-title")
      ?.textContent?.trim();

  const company =
    document
      .querySelector(".job-details-jobs-unified-top-card__company-name")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-unified-top-card__company-name")
      ?.textContent?.trim() ||
    document
      .querySelector(".job-details-jobs-unified-top-card__company-name a")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-details-top-card__company-name")
      ?.textContent?.trim() ||
    document.querySelector("a.ember-view.t-black")?.textContent?.trim();

  const location =
    document
      .querySelector(".job-details-jobs-unified-top-card__bullet")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-unified-top-card__bullet")
      ?.textContent?.trim() ||
    document
      .querySelector(".job-details-jobs-unified-top-card__primary-description")
      ?.textContent?.trim() ||
    document
      .querySelector(".jobs-details-top-card__location")
      ?.textContent?.trim();

  const description =
    document.querySelector(".jobs-description__content")?.innerText ||
    document.querySelector(".jobs-description")?.innerText ||
    document.querySelector(".show-more-less-html__markup")?.innerText ||
    document.querySelector(".jobs-box__html-content")?.innerText ||
    document.querySelector("#job-details")?.innerText;

  return { position, company, location, description, source: "LinkedIn" };
}

function extractIndeed() {
  let position = document
    .querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')
    ?.textContent?.trim();
  let company = document
    .querySelector('[data-testid="inlineHeader-companyName"]')
    ?.textContent?.trim();
  let location = document
    .querySelector(
      '[data-testid="jobsearch-JobInfoHeader-subtutle"] div:last-child',
    )
    ?.textContent?.trim();
  let description = document.querySelector("#jobDescriptionText")?.innerText;

  if (!position || !company) {
    position =
      position ||
      document.querySelector(".jobTitle span[title]")?.getAttribute("title") ||
      document.querySelector(".jobTitle span")?.textContent?.trim() ||
      document.querySelector("h2.jobTitle")?.textContent?.trim() ||
      document.querySelector("h1.jobTitle")?.textContent?.trim();

    company =
      company ||
      document
        .querySelector('[data-testid="company-name"]')
        ?.textContent?.trim() ||
      document
        .querySelector('[data-company-name="true"]')
        ?.textContent?.trim() ||
      document.querySelector(".companyName")?.textContent?.trim();

    location =
      location ||
      document
        .querySelector('[data-testid="text-location"]')
        ?.textContent?.trim() ||
      document.querySelector(".companyLocation")?.textContent?.trim();

    description =
      description ||
      document.querySelector(".jobsearch-JobComponent-description")
        ?.innerText ||
      document.querySelector(".job-snippet")?.textContent?.trim();
  }

  if (!position || !company) {
    position =
      position ||
      document.querySelector(".icl-u-xs-mb--xs")?.textContent?.trim();
    company =
      company ||
      document.querySelector(".icl-u-lg-mr--sm")?.textContent?.trim();
  }

  return { position, company, location, description, source: "Indeed" };
}

function extractGlassdoor() {
  let company =
    document.querySelector('[class*="employer"]')?.textContent?.trim() ||
    document
      .querySelector('[data-test="employer-name"]')
      ?.textContent?.trim() ||
    document.querySelector('a[href*="/Overview/"]')?.textContent?.trim();

  if (company) company = company.replace(/\s*\d+\.\d+\s*$/, "").trim();

  return {
    position:
      document.querySelector("h1")?.textContent?.trim() ||
      document.querySelector('[data-test="job-title"]')?.textContent?.trim() ||
      document.querySelector(".e1tk4kwz4")?.textContent?.trim(),
    company,
    location:
      document.querySelector('[class*="location"]')?.textContent?.trim() ||
      document.querySelector('[data-test="location"]')?.textContent?.trim(),
    description:
      document.querySelector('div[class*="JobDetails_jobDescription"]')
        ?.innerText ||
      document.querySelector('[class*="jobDescription"]')?.innerText ||
      document.querySelector(".jobDescriptionContent")?.innerText,
    source: "Glassdoor",
  };
}

function extractZipRecruiter() {
  let description = null;
  for (const h2 of document.querySelectorAll("h2")) {
    if (h2.textContent.trim() === "Job description") {
      description = h2.parentElement?.innerText;
      break;
    }
  }
  if (!description) {
    description =
      document.querySelector(".job_description")?.innerText ||
      document.querySelector('[data-testid="jobDescription"]')?.innerText;
  }

  return {
    position:
      document.querySelector("h2")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim(),
    company:
      document.querySelector('[data-testid*="company"]')?.textContent?.trim() ||
      document
        .querySelector('[data-testid="companyName"]')
        ?.textContent?.trim(),
    location:
      document
        .querySelector('[data-testid*="location"]')
        ?.textContent?.trim() ||
      document
        .querySelector('[data-testid="jobLocation"]')
        ?.textContent?.trim(),
    description,
    source: "ZipRecruiter",
  };
}

function extractRemoteOK() {
  let location = "Remote";
  for (const el of document.querySelectorAll("h1, h2, h3, h4, strong, b")) {
    if (el.textContent.trim() === "Location") {
      const next = el.nextElementSibling;
      if (next?.textContent?.trim()) {
        location = next.textContent.trim();
      }
      break;
    }
  }

  return {
    position:
      document.querySelector('h2[itemprop="title"]')?.textContent?.trim() ||
      document.querySelector("h2")?.textContent?.trim(),
    company:
      document.querySelector('h3[itemprop="name"]')?.textContent?.trim() ||
      document.querySelector("h3")?.textContent?.trim(),
    location,
    description:
      document.querySelector(".markdown")?.innerText ||
      document.querySelector('[itemprop="description"]')?.innerText ||
      document.querySelector(".description")?.innerText,
    source: "RemoteOK",
  };
}

function extractWellfound() {
  let company = null;
  for (const link of document.querySelectorAll("a.text-neutral-1000")) {
    const text = link.textContent?.trim();
    if (
      text &&
      text.length > 2 &&
      text.length < 100 &&
      link.href.includes("/company/")
    ) {
      company = text;
      break;
    }
  }
  if (!company) {
    company =
      document
        .querySelector('[data-test="StartupName"]')
        ?.textContent?.trim() ||
      document.querySelector(".company-name")?.textContent?.trim();
  }

  let location = null;
  for (const el of document.querySelectorAll(".styles_characteristic__nbbma")) {
    const text = el.textContent?.trim();
    if (text?.includes("Remote work policy")) {
      location = text.replace("Remote work policy", "").trim();
      break;
    }
  }
  if (!location) {
    location =
      document
        .querySelector('[data-test="job-location"]')
        ?.textContent?.trim() ||
      document.querySelector(".location")?.textContent?.trim();
  }

  return {
    position:
      document.querySelector("h1")?.textContent?.trim() ||
      document.querySelector('[data-test="JobTitle"]')?.textContent?.trim(),
    company,
    location,
    description:
      document.querySelector(".styles_description__36q7q")?.innerText ||
      document.querySelector('[class*="description"]')?.innerText ||
      document.querySelector('[data-test="JobDescription"]')?.innerText,
    source: "Wellfound",
  };
}

function extractMonster() {
  return {
    position:
      document
        .querySelector('h1[data-test-id="svx-job-title"]')
        ?.textContent?.trim() ||
      document.querySelector(".JobViewTitle")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim(),
    company:
      document
        .querySelector('[data-test-id="svx-jobview-company-name"]')
        ?.textContent?.trim() ||
      document.querySelector(".company-name")?.textContent?.trim(),
    location:
      document
        .querySelector('[data-test-id="svx-job-location"]')
        ?.textContent?.trim() ||
      document.querySelector(".location")?.textContent?.trim(),
    description:
      document.querySelector('[data-test-id="svx-job-description-text"]')
        ?.innerText ||
      document.querySelector(".JobDescription")?.innerText ||
      document.querySelector("#JobDescription")?.innerText,
    source: "Monster",
  };
}

// ─── Main Extractor ───────────────────────────────────────────────────────────

function extractJobData() {
  const url = window.location.href;
  let extracted = null;

  if (url.includes("linkedin.com/jobs")) extracted = extractLinkedIn();
  else if (url.includes("indeed.com")) extracted = extractIndeed();
  else if (url.includes("glassdoor.com")) extracted = extractGlassdoor();
  else if (url.includes("ziprecruiter.com")) extracted = extractZipRecruiter();
  else if (url.includes("remoteok.com") || url.includes("remoteok.io"))
    extracted = extractRemoteOK();
  else if (url.includes("wellfound.com") || url.includes("angel.co"))
    extracted = extractWellfound();
  else if (url.includes("monster.com")) extracted = extractMonster();

  if (!extracted) return null;

  const jobData = {
    position: extracted.position || "",
    company: extracted.company || "",
    location: extracted.location || "",
    description: extracted.description || "",
    url: window.location.href,
    source: extracted.source,
  };

  return jobData;
}

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJob") {
    sendResponse({ jobData: extractJobData() });
  }
  return true;
});
