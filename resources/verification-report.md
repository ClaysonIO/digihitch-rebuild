# Verification report

This report covers an automated check run on 2026-11-02, after the research pass. For every `###` law section in `resources/laws/*.md`, the script fetched the section's **Source** link(s) with a plain HTTP request. It reduced the page and the file's `>` quotes to lowercase words, then tested whether each quoted passage of six or more words appears in the source text. Passages separated by `[...]` are checked separately.

How to read the columns:

- **Matched:** every quoted passage was found word for word in the linked source.
- **Partial:** some passages were found and others weren't. These were spot-checked by hand. The misses come from source formatting: bilingual two-column PDFs (NWT, Nunavut), fine tables (NS, MA), or subsection labels between lines. No changed wording was found.
- **Not machine-checkable:** the source returned a bot-check page, a JavaScript-only shell or a timeout to the plain request. Examples are leginfo.legislature.ca.gov, palegis.us, FindLaw, gc.nh.gov, the Alabama and South Dakota code sites, and the Utah xcode page. The researchers retrieved these during the research pass (through WebFetch, a versioned file or a bulk download, as each file says), but this automated check could not re-fetch them.

Sections counted below are law sections. A file's `## Unverified / open questions` section lists anything the researcher could not confirm.

| File | Status | Law sections | Matched | Partial | Not machine-checkable |
|---|---|---|---|---|---|
| [CA_AB.md](laws/CA_AB.md) | legal | 5 | 5 | 0 | 0 |
| [CA_BC.md](laws/CA_BC.md) | restricted | 4 | 4 | 0 | 0 |
| [CA_MB.md](laws/CA_MB.md) | legal | 5 | 5 | 0 | 0 |
| [CA_NB.md](laws/CA_NB.md) | restricted | 5 | 5 | 0 | 0 |
| [CA_NL.md](laws/CA_NL.md) | restricted | 4 | 3 | 1 | 0 |
| [CA_NS.md](laws/CA_NS.md) | restricted | 6 | 5 | 1 | 0 |
| [CA_NT.md](laws/CA_NT.md) | legal | 3 | 0 | 1 | 2 |
| [CA_NU.md](laws/CA_NU.md) | legal | 3 | 3 | 0 | 0 |
| [CA_ON.md](laws/CA_ON.md) | restricted | 6 | 6 | 0 | 0 |
| [CA_PE.md](laws/CA_PE.md) | restricted | 4 | 0 | 0 | 4 |
| [CA_QC.md](laws/CA_QC.md) | restricted | 1 | 1 | 0 | 0 |
| [CA_SK.md](laws/CA_SK.md) | legal | 4 | 0 | 0 | 4 |
| [CA_YT.md](laws/CA_YT.md) | unverified | 0 | 0 | 0 | 0 |
| [US_AK.md](laws/US_AK.md) | restricted | 5 | 0 | 0 | 5 |
| [US_AL.md](laws/US_AL.md) | illegal_with_exceptions | 6 | 0 | 0 | 6 |
| [US_AR.md](laws/US_AR.md) | restricted | 2 | 0 | 1 | 1 |
| [US_AZ.md](laws/US_AZ.md) | restricted | 5 | 5 | 0 | 0 |
| [US_CA.md](laws/US_CA.md) | restricted | 5 | 0 | 0 | 5 |
| [US_CO.md](laws/US_CO.md) | restricted | 4 | 4 | 0 | 0 |
| [US_CT.md](laws/US_CT.md) | restricted | 8 | 8 | 0 | 0 |
| [US_DC.md](laws/US_DC.md) | restricted | 4 | 0 | 0 | 4 |
| [US_DE.md](laws/US_DE.md) | illegal | 6 | 6 | 0 | 0 |
| [US_FL.md](laws/US_FL.md) | restricted | 4 | 4 | 0 | 0 |
| [US_GA.md](laws/US_GA.md) | restricted | 4 | 1 | 0 | 3 |
| [US_HI.md](laws/US_HI.md) | illegal_with_exceptions | 5 | 5 | 0 | 0 |
| [US_IA.md](laws/US_IA.md) | restricted | 5 | 5 | 0 | 0 |
| [US_ID.md](laws/US_ID.md) | illegal | 6 | 6 | 0 | 0 |
| [US_IL.md](laws/US_IL.md) | restricted | 8 | 7 | 1 | 0 |
| [US_IN.md](laws/US_IN.md) | restricted | 7 | 7 | 0 | 0 |
| [US_KS.md](laws/US_KS.md) | restricted | 6 | 4 | 2 | 0 |
| [US_KY.md](laws/US_KY.md) | illegal_with_exceptions | 5 | 4 | 1 | 0 |
| [US_LA.md](laws/US_LA.md) | restricted | 5 | 5 | 0 | 0 |
| [US_MA.md](laws/US_MA.md) | restricted | 7 | 6 | 1 | 0 |
| [US_MD.md](laws/US_MD.md) | restricted | 5 | 5 | 0 | 0 |
| [US_ME.md](laws/US_ME.md) | restricted | 5 | 5 | 0 | 0 |
| [US_MI.md](laws/US_MI.md) | legal | 9 | 9 | 0 | 0 |
| [US_MN.md](laws/US_MN.md) | restricted | 4 | 4 | 0 | 0 |
| [US_MO.md](laws/US_MO.md) | legal | 4 | 4 | 0 | 0 |
| [US_MS.md](laws/US_MS.md) | restricted | 4 | 1 | 0 | 3 |
| [US_MT.md](laws/US_MT.md) | restricted | 5 | 5 | 0 | 0 |
| [US_NC.md](laws/US_NC.md) | restricted | 8 | 8 | 0 | 0 |
| [US_ND.md](laws/US_ND.md) | restricted | 5 | 4 | 1 | 0 |
| [US_NE.md](laws/US_NE.md) | restricted | 6 | 6 | 0 | 0 |
| [US_NH.md](laws/US_NH.md) | restricted | 4 | 0 | 0 | 4 |
| [US_NJ.md](laws/US_NJ.md) | illegal | 7 | 3 | 0 | 4 |
| [US_NM.md](laws/US_NM.md) | restricted | 5 | 2 | 0 | 3 |
| [US_NV.md](laws/US_NV.md) | illegal | 5 | 4 | 1 | 0 |
| [US_NY.md](laws/US_NY.md) | restricted | 7 | 7 | 0 | 0 |
| [US_OH.md](laws/US_OH.md) | restricted | 7 | 7 | 0 | 0 |
| [US_OK.md](laws/US_OK.md) | restricted | 6 | 6 | 0 | 0 |
| [US_OR.md](laws/US_OR.md) | restricted | 6 | 4 | 2 | 0 |
| [US_PA.md](laws/US_PA.md) | restricted | 6 | 1 | 1 | 4 |
| [US_RI.md](laws/US_RI.md) | restricted | 6 | 6 | 0 | 0 |
| [US_SC.md](laws/US_SC.md) | restricted | 6 | 6 | 0 | 0 |
| [US_SD.md](laws/US_SD.md) | legal | 5 | 0 | 0 | 5 |
| [US_TN.md](laws/US_TN.md) | restricted | 5 | 1 | 0 | 4 |
| [US_TX.md](laws/US_TX.md) | restricted | 6 | 6 | 0 | 0 |
| [US_UT.md](laws/US_UT.md) | legal | 1 | 0 | 0 | 1 |
| [US_VA.md](laws/US_VA.md) | restricted | 6 | 6 | 0 | 0 |
| [US_VT.md](laws/US_VT.md) | restricted | 5 | 5 | 0 | 0 |
| [US_WA.md](laws/US_WA.md) | restricted | 5 | 5 | 0 | 0 |
| [US_WI.md](laws/US_WI.md) | restricted | 7 | 7 | 0 | 0 |
| [US_WV.md](laws/US_WV.md) | restricted | 4 | 4 | 0 | 0 |
| [US_WY.md](laws/US_WY.md) | legal | 5 | 5 | 0 | 0 |
| **Total** | | **326** | **250** | **14** | **62** |

To re-run the check: `python3 scripts/verify-quotes.py`
