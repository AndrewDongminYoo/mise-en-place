/* eslint-disable @next/next/no-img-element -- Local Blob URLs cannot use server image optimization. */

import type { Ref } from "react";

import {
  RESUME_SHEET_COPY,
  formatDuration,
  formatMonthRange,
  getEmployerLabel,
  hasPublicRecordBadge,
  type CareerEntry,
  type CareerPhotoReference,
  type CareerSummary,
  type ResumeIdentity,
} from "./resume-model.mts";

type ResumeSheetProps = {
  /** Already stripped by `toReviewIdentity` when the review copy is active. */
  identity: ResumeIdentity;
  /** The included careers, in order. */
  careers: readonly CareerEntry[];
  summary: CareerSummary;
  showSummary: boolean;
  /** Photo asset id to object URL. */
  photoUrls: ReadonlyMap<string, string>;
  isDemo: boolean;
  /** `page.tsx` waits for the sheet's images before `window.print`. */
  ref: Ref<HTMLElement>;
};

function getResumePhotoReference(
  career: CareerEntry,
): CareerPhotoReference | null {
  if (!career.resumePhotoId) {
    return null;
  }

  return (
    career.portfolioPhotos.find(
      (photo) => photo.assetId === career.resumePhotoId,
    ) ?? null
  );
}

function joinChoices(items: readonly string[]) {
  return items.join(" · ");
}

function PublicRecordBadge() {
  return (
    <span className="public-record-badge" title={RESUME_SHEET_COPY.badgeTitle}>
      <span aria-hidden="true">✓</span>
      {RESUME_SHEET_COPY.badgeLabel}
    </span>
  );
}

/**
 * The printed resume. It renders from props alone: the parent decides which
 * identity it gets (full or review copy), which careers are included, and
 * whether the summary band shows.
 */
export function ResumeSheet({
  identity,
  careers,
  summary,
  showSummary,
  photoUrls,
  isDemo,
  ref,
}: ResumeSheetProps) {
  const profilePhotoUrl = identity.profilePhotoId
    ? photoUrls.get(identity.profilePhotoId)
    : undefined;
  const duration = formatDuration(summary.totalMonths);
  const summaryHeadline = [
    duration ? `${RESUME_SHEET_COPY.durationPrefix} ${duration}` : "",
    ...summary.specialties,
  ]
    .filter(Boolean)
    .join(" · ");
  const summaryRows = [
    { label: RESUME_SHEET_COPY.stationsLabel, items: summary.stations },
    { label: RESUME_SHEET_COPY.skillsLabel, items: summary.skills },
    { label: RESUME_SHEET_COPY.equipmentLabel, items: summary.equipment },
  ].filter((row) => row.items.length > 0);
  const hasSummaryBand =
    showSummary && (summaryHeadline.length > 0 || summaryRows.length > 0);
  const hasBadge = careers.some(hasPublicRecordBadge);

  return (
    <article className="resume-sheet" data-print-root ref={ref}>
      <header className="resume-header">
        <div className="resume-identity-lockup">
          {profilePhotoUrl ? (
            <img
              className="resume-profile-photo"
              src={profilePhotoUrl}
              alt={`${identity.name || "사용자"} 프로필 사진`}
            />
          ) : null}
          <div>
            <p className="resume-label">
              CULINARY RESUME{" "}
              {isDemo ? <span className="demo-tag">예시 이력서</span> : null}
            </p>
            {/* Without a name the headline becomes the sheet's own heading,
                so the review copy keeps the same heading levels rather than
                skipping from the page to h3. */}
            <h2>{identity.name || identity.headline}</h2>
            {identity.name ? (
              <p className="resume-headline">{identity.headline}</p>
            ) : null}
          </div>
        </div>
        {identity.email || identity.phone ? (
          <address>
            {identity.email ? <span>{identity.email}</span> : null}
            {identity.phone ? <span>{identity.phone}</span> : null}
          </address>
        ) : null}
      </header>

      {hasSummaryBand ? (
        <section className="resume-section resume-summary-band">
          <div className="resume-summary-heading-row">
            <h3>{RESUME_SHEET_COPY.summaryTitle}</h3>
            <p className="resume-summary-caption">
              {RESUME_SHEET_COPY.summaryCaption}
            </p>
          </div>
          {summaryHeadline ? (
            <p className="resume-summary-headline">{summaryHeadline}</p>
          ) : null}
          {summaryRows.length > 0 ? (
            <dl className="resume-summary-grid">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{joinChoices(row.items)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      {identity.summary ? (
        <section className="resume-section resume-summary">
          <h3>경력 요약</h3>
          <p>{identity.summary}</p>
        </section>
      ) : null}

      <section className="resume-section">
        <h3>경력</h3>
        <div className="resume-careers">
          {careers.map((career) => {
            const resumePhoto = getResumePhotoReference(career);
            const resumePhotoUrl = resumePhoto
              ? photoUrls.get(resumePhoto.assetId)
              : undefined;
            const kitchenItems = [...career.skills, ...career.equipment];
            const showBadge = hasPublicRecordBadge(career);

            return (
              <article className="resume-career" key={career.id}>
                <header>
                  <div className="resume-career-heading">
                    <div className="resume-career-title">
                      <h4>{career.restaurantName}</h4>
                      {career.role ? (
                        <p className="resume-career-role">{career.role}</p>
                      ) : null}
                    </div>
                    <p className="resume-career-period">
                      {formatMonthRange(
                        career.employmentStart,
                        career.employmentEnd,
                      )}
                      {career.restaurantLocation
                        ? ` · ${career.restaurantLocation}`
                        : ""}
                    </p>
                    {career.legalEmployer ? (
                      <small className="resume-employer">
                        <span>
                          {getEmployerLabel(career.origin)}:{" "}
                          {career.legalEmployer}
                        </span>
                        {showBadge ? <PublicRecordBadge /> : null}
                      </small>
                    ) : null}
                  </div>
                  {career.isDemo ? (
                    <span className="demo-tag">예시 데이터</span>
                  ) : null}
                </header>

                {career.restaurantHighlights.length > 0 ? (
                  <ul className="resume-highlights">
                    {career.restaurantHighlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}

                {career.responsibilities.length > 0 ? (
                  <dl className="resume-duties">
                    <dt>{RESUME_SHEET_COPY.dutiesLabel}</dt>
                    <dd>{joinChoices(career.responsibilities)}</dd>
                  </dl>
                ) : null}

                {career.representativeExperience ? (
                  <p className="resume-representative">
                    {career.representativeExperience}
                  </p>
                ) : null}

                {resumePhoto && resumePhotoUrl ? (
                  <figure className="resume-career-photo">
                    <img src={resumePhotoUrl} alt={resumePhoto.description} />
                    <figcaption>{resumePhoto.description}</figcaption>
                  </figure>
                ) : null}

                {career.stations.length > 0 || kitchenItems.length > 0 ? (
                  <dl className="resume-kitchen-line">
                    {career.stations.length > 0 ? (
                      <div>
                        <dt>{RESUME_SHEET_COPY.entryStationsLabel}</dt>
                        <dd>{joinChoices(career.stations)}</dd>
                      </div>
                    ) : null}
                    {kitchenItems.length > 0 ? (
                      <div>
                        <dt>{RESUME_SHEET_COPY.entryKitchenLabel}</dt>
                        <dd>{joinChoices(kitchenItems)}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="resume-legend">
        <p>
          {hasBadge
            ? RESUME_SHEET_COPY.legendWithBadge
            : RESUME_SHEET_COPY.legendWithoutBadge}
        </p>
      </footer>
    </article>
  );
}
