# NorthGuard — Traceability Matrix (Software Bill of Materials)

US → FT → AF → SF → implementation file → test file. The single artifact that
answers "if I change this file, which requirements are affected?" and "if I build
this story, which files do I touch?" Deferred epics (E1/E8) carry no SF rows —
only their contract types. E5 is now decomposed (§8 A1) and carries SF rows.

Language key: TS files under `core/` (E2–E4, E6) and `web/` (E5 React SPA);
Python files under `sidecar/` and `recurring/` (E7).

| US | FT | AF | SF | Implementation file | Test file |
|----|----|----|----|--------------------|-----------|
| US-001 | FT-2.1 | AF-201 | SF-2011 | core/src/features/policy/ingest/acceptPolicyInput.ts | .test.ts |
| US-001 | FT-2.1 | AF-201 | SF-2012 | core/src/features/policy/ingest/extractPdfText.ts | .test.ts |
| US-001 | FT-2.1 | AF-201 | SF-2013 | core/src/features/policy/ingest/normalizePolicyText.ts | .test.ts |
| US-001 | FT-2.1 | AF-201 | SF-2014 | core/src/features/policy/ingest/computePolicyHash.ts | .test.ts |
| US-002 | FT-2.2 | AF-202 | SF-2021 | core/src/features/policy/extract/requestConceptGraph.ts | .test.ts |
| US-002 | FT-2.2 | AF-202 | SF-2022 | core/src/features/policy/extract/mapGraphToAreas.ts | .test.ts |
| US-002 | FT-2.2 | AF-202 | SF-2023 | core/src/features/policy/extract/readCachedGraph.ts | .test.ts |
| US-002/003 | FT-2.3 | AF-203 | SF-2031 | core/src/features/policy/stability/readStabilityIndex.ts | .test.ts |
| US-002/003 | FT-2.3 | AF-203 | SF-2032 | core/src/features/policy/stability/enforceStabilityThreshold.ts | .test.ts |
| US-002/003 | FT-2.3 | AF-203 | SF-2033 | core/src/features/policy/stability/buildStabilityReport.ts | .test.ts |
| US-004 | FT-2.4 | AF-204 | SF-2041 | core/src/features/policy/confirm/buildAreaConfirmationModel.ts | .test.ts |
| US-004 | FT-2.4 | AF-204 | SF-2042 | core/src/features/policy/confirm/applyManualEdits.ts | .test.ts |
| US-004 | FT-2.4 | AF-204 | SF-2043 | core/src/features/policy/confirm/validateAreaSet.ts | .test.ts |
| US-005 | FT-2.5 | AF-205 | SF-2051 | core/src/features/policy/modes/setAreaMode.ts | .test.ts |
| US-005 | FT-2.5 | AF-205 | SF-2052 | core/src/features/policy/modes/validateModeConfig.ts | .test.ts |
| US-005 | FT-2.5 | AF-206 | SF-2061 | core/src/features/policy/activate/guardActivation.ts | .test.ts |
| US-005 | FT-2.5 | AF-206 | SF-2062 | core/src/features/policy/activate/writeActivationGovernanceEvent.ts | .test.ts |
| US-005 | FT-2.5 | AF-206 | SF-2063 | core/src/features/policy/activate/publishActivePolicy.ts | .test.ts |
| US-006 | FT-3.1 | AF-301 | SF-3011 | core/src/features/inspection/rules/loadLexicons.ts | .test.ts |
| US-006 | FT-3.1 | AF-301 | SF-3012 | core/src/features/inspection/rules/matchRulePatterns.ts | .test.ts |
| US-006 | FT-3.1 | AF-301 | SF-3013 | core/src/features/inspection/rules/matchLexiconTerms.ts | .test.ts |
| US-006 | FT-3.1 | AF-301 | SF-3014 | core/src/features/inspection/rules/mapHitsToAreas.ts | .test.ts |
| US-007 | FT-3.2 | AF-302 | SF-3021 | core/src/features/inspection/backstop/backstopAvailabilityGuard.ts | .test.ts |
| US-007 | FT-3.2 | AF-302 | SF-3022 | core/src/features/inspection/backstop/shouldInvokeBackstop.ts | .test.ts |
| US-007 | FT-3.2 | AF-302 | SF-3023 | core/src/features/inspection/backstop/buildBackstopPrompt.ts | .test.ts |
| US-007 | FT-3.2 | AF-302 | SF-3024 | core/src/features/inspection/backstop/callBackstopModel.ts | .test.ts |
| US-007 | FT-3.2 | AF-302 | SF-3025 | core/src/features/inspection/backstop/parseBackstopFindings.ts | .test.ts |
| US-008 | FT-3.3 | AF-303 | SF-3031 | core/src/features/inspection/verdict/resolveTouchedAreas.ts | .test.ts |
| US-008 | FT-3.3 | AF-303 | SF-3032 | core/src/features/inspection/verdict/computeSpans.ts | .test.ts |
| US-008 | FT-3.3 | AF-303 | SF-3033 | core/src/features/inspection/verdict/decideVerdictMode.ts | .test.ts |
| US-008 | FT-3.3 | AF-303 | SF-3034 | core/src/features/inspection/verdict/computeConfidence.ts | .test.ts |
| US-008 | FT-3.3 | AF-303 | SF-3035 | core/src/features/inspection/verdict/assembleVerdict.ts | .test.ts |
| US-009 | FT-3.4 | AF-304 | SF-3041 | core/src/features/inspection/transcript/placeholders/classifyEntityType.ts | .test.ts |
| US-009 | FT-3.4 | AF-304 | SF-3042 | core/src/features/inspection/transcript/placeholders/assignSemanticPlaceholder.ts | .test.ts |
| US-009 | FT-3.4 | AF-304 | SF-3043 | core/src/features/inspection/transcript/placeholders/indexCollidingEntities.ts | .test.ts |
| US-009 | FT-3.4 | AF-304 | SF-3044 | core/src/features/inspection/transcript/placeholders/buildWireText.ts | .test.ts |
| US-010 | FT-3.5 | AF-305 | SF-3051 | core/src/features/inspection/transcript/pseudonym/normalizeEntityValue.ts | .test.ts |
| US-010 | FT-3.5 | AF-305 | SF-3052 | core/src/features/inspection/transcript/pseudonym/computePseudonymHmac.ts | .test.ts |
| US-010 | FT-3.5 | AF-305 | SF-3053 | core/src/features/inspection/transcript/pseudonym/attachPseudonymToSpan.ts | .test.ts |
| US-011 | FT-3.6 | AF-306 | SF-3061 | core/src/features/inspection/transcript/wire/composeWireMessage.ts | .test.ts |
| US-011 | FT-3.6 | AF-306 | SF-3062 | core/src/features/inspection/transcript/wire/assertWireIsolation.ts | .test.ts |
| US-012 | FT-3.7 | AF-307 | SF-3071 | core/src/features/inspection/transcript/rehydrate/buildRehydrationIndex.ts | .test.ts |
| US-012 | FT-3.7 | AF-307 | SF-3072 | core/src/features/inspection/transcript/rehydrate/matchPlaceholderTokens.ts | .test.ts |
| US-012 | FT-3.7 | AF-307 | SF-3073 | core/src/features/inspection/transcript/rehydrate/markRestoredSpans.ts | .test.ts |
| US-012 | FT-3.7 | AF-307 | SF-3074 | core/src/features/inspection/transcript/rehydrate/collectUnresolved.ts | .test.ts |
| US-013 | FT-4.1 | AF-401 | SF-4011 | core/src/features/ledger/append/loadChainTail.ts | .test.ts |
| US-013 | FT-4.1 | AF-401 | SF-4012 | core/src/features/ledger/append/computeEntryHash.ts | .test.ts |
| US-013 | FT-4.1 | AF-401 | SF-4013 | core/src/features/ledger/append/appendAtomic.ts | .test.ts |
| US-013 | FT-4.1 | AF-401 | SF-4014 | core/src/features/ledger/append/appendLedgerEntry.ts | .test.ts |
| US-013 | FT-4.1 | AF-401 | SF-4015 | core/src/features/ledger/append/assertNoPlaintextActor.ts | .test.ts |
| US-014 | FT-4.2 | AF-402 | SF-4024 | core/src/features/ledger/request/deriveActorPseudonym.ts | .test.ts |
| US-014 | FT-4.2 | AF-402 | SF-4021 | core/src/features/ledger/request/buildRequestEntry.ts | .test.ts |
| US-014 | FT-4.2 | AF-402 | SF-4022 | core/src/features/ledger/request/redactBeforeWrite.ts | .test.ts |
| US-014 | FT-4.2 | AF-402 | SF-4023 | core/src/features/ledger/request/writeRequestEntry.ts | .test.ts |
| US-015 | FT-4.3 | AF-403 | SF-4031 | core/src/features/ledger/governance/buildGovernanceEntry.ts | .test.ts |
| US-015 | FT-4.3 | AF-403 | SF-4032 | core/src/features/ledger/governance/writeGovernanceEvent.ts | .test.ts |
| US-016 | FT-4.4 | AF-404 | SF-4041 | core/src/features/ledger/query/parseLedgerStream.ts | .test.ts |
| US-016 | FT-4.4 | AF-404 | SF-4042 | core/src/features/ledger/query/filterByDateArea.ts | .test.ts |
| US-016 | FT-4.4 | AF-404 | SF-4043 | core/src/features/ledger/query/projectSafeFields.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4051 | core/src/features/ledger/export/collectRange.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4052 | core/src/features/ledger/export/buildCsv.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4053 | core/src/features/ledger/export/buildJsonl.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4054 | core/src/features/ledger/export/computeBundleChecksum.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4055 | core/src/features/ledger/export/writeExportGovernanceEvent.ts | .test.ts |
| US-017 | FT-4.5 | AF-405 | SF-4056 | core/src/features/ledger/export/assertExportPrivacy.ts | .test.ts |
| US-017 | FT-4.5 | AF-406 | SF-4061 | core/src/features/ledger/verify/recomputeChain.ts | .test.ts |
| US-018 | FT-4.6 | AF-407 | SF-4071 | core/src/features/ledger/backup/snapshotLedger.ts | .test.ts |
| US-018 | FT-4.6 | AF-407 | SF-4072 | core/src/features/ledger/backup/verifyBackupChain.ts | .test.ts |
| US-031 | FT-4.7 | AF-408 | SF-4081 | core/src/features/ledger/unmask/buildUnmaskRequest.ts | .test.ts |
| US-031 | FT-4.7 | AF-408 | SF-4082 | core/src/features/ledger/unmask/verifyDualAuthorisation.ts | .test.ts |
| US-031 | FT-4.7 | AF-408 | SF-4083 | core/src/features/ledger/unmask/resolveActorIdentity.ts | .test.ts |
| US-031 | FT-4.7 | AF-408 | SF-4084 | core/src/features/ledger/unmask/writeUnmaskGovernanceEvent.ts | .test.ts |
| US-031 | FT-4.7 | AF-408 | SF-4085 | core/src/features/ledger/unmask/unmaskActor.ts | .test.ts |
| US-019 | FT-6.1 | AF-601 | SF-6011 | core/src/features/management/exposure/aggregateTouchesByArea.ts | .test.ts |
| US-019 | FT-6.1 | AF-601 | SF-6012 | core/src/features/management/exposure/computeAreaTrend.ts | .test.ts |
| US-019 | FT-6.1 | AF-601 | SF-6013 | core/src/features/management/exposure/orderByConcentration.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6021 | core/src/features/management/briefing/gatherBriefingInputs.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6022 | core/src/features/management/briefing/synthesizeThemes.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6023 | core/src/features/management/briefing/synthesizeFriction.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6024 | core/src/features/management/briefing/assessPolicyFit.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6025 | core/src/features/management/briefing/buildBriefingFootnote.ts | .test.ts |
| US-020 | FT-6.2 | AF-602 | SF-6026 | core/src/features/management/briefing/renderBriefingMarkdown.ts | .test.ts |
| US-021 | FT-6.3 | AF-603 | SF-6031 | core/src/features/management/activity/aggregateActivityRows.ts | .test.ts |
| US-021 | FT-6.3 | AF-603 | SF-6032 | core/src/features/management/activity/applyAggregationGuard.ts | .test.ts |
| US-022 | FT-6.4 | AF-604 | SF-6041 | core/src/features/management/fp-queue/groupReportsByTrigger.ts | .test.ts |
| US-022 | FT-6.4 | AF-604 | SF-6042 | core/src/features/management/fp-queue/sortByRepeatFrequency.ts | .test.ts |
| US-022 | FT-6.4 | AF-604 | SF-6043 | core/src/features/management/fp-queue/previewRuleNarrowing.ts | .test.ts |
| US-022 | FT-6.4 | AF-604 | SF-6044 | core/src/features/management/fp-queue/applyResolution.ts | .test.ts |
| US-022 | FT-6.4 | AF-604 | SF-6045 | core/src/features/management/fp-queue/notifyReporter.ts | .test.ts |
| US-023 | FT-6.5 | AF-605 | SF-6051 | core/src/features/management/export-view/validateExportRequest.ts | .test.ts |
| US-023 | FT-6.5 | AF-605 | SF-6052 | core/src/features/management/export-view/invokeExport.ts | .test.ts |
| US-024 | FT-6.6 | AF-606 | SF-6061 | core/src/features/management/context/resolveViewContext.ts | .test.ts |
| US-024 | FT-6.6 | AF-606 | SF-6062 | core/src/features/management/context/buildThresholdModel.ts | .test.ts |
| US-025 | FT-7.1 | AF-701 | SF-7011 | recurring/features/load_redacted_corpus.py | test_load_redacted_corpus.py |
| US-025 | FT-7.1 | AF-701 | SF-7012 | recurring/features/tokenize_and_shingle.py | test_tokenize_and_shingle.py |
| US-025 | FT-7.1 | AF-701 | SF-7013 | recurring/features/attach_pseudonyms.py | test_attach_pseudonyms.py |
| US-026 | FT-7.2 | AF-702 | SF-7021 | recurring/minhash/compute_signatures.py | test_compute_signatures.py |
| US-026 | FT-7.2 | AF-702 | SF-7022 | recurring/minhash/lsh_bucketize.py | test_lsh_bucketize.py |
| US-026 | FT-7.2 | AF-702 | SF-7023 | recurring/minhash/emit_candidate_pairs.py | test_emit_candidate_pairs.py |
| US-027 | FT-7.3 | AF-703 | SF-7031 | recurring/semantic/embed_documents.py | test_embed_documents.py |
| US-027 | FT-7.3 | AF-703 | SF-7032 | recurring/semantic/cosine_within_threshold.py | test_cosine_within_threshold.py |
| US-027 | FT-7.3 | AF-703 | SF-7033 | recurring/semantic/connected_components_cluster.py | test_connected_components_cluster.py |
| US-027 | FT-7.3 | AF-703 | SF-7034 | recurring/semantic/record_model_provenance.py | test_record_model_provenance.py |
| US-028 | FT-7.4 | AF-704 | SF-7041 | recurring/resolve/group_by_pseudonym.py | test_group_by_pseudonym.py |
| US-028 | FT-7.4 | AF-704 | SF-7042 | recurring/resolve/merge_pseudonym_across_cluster.py | test_merge_pseudonym_across_cluster.py |
| US-028 | FT-7.4 | AF-704 | SF-7043 | recurring/resolve/guard_key_epoch.py | test_guard_key_epoch.py |
| US-029 | FT-7.5 | AF-705 | SF-7051 | recurring/temporal/bucket_by_time.py | test_bucket_by_time.py |
| US-029 | FT-7.5 | AF-705 | SF-7052 | recurring/temporal/classify_trend.py | test_classify_trend.py |
| US-029 | FT-7.5 | AF-705 | SF-7053 | recurring/temporal/detect_cadence.py | test_detect_cadence.py |
| US-029 | FT-7.5 | AF-705 | SF-7054 | recurring/temporal/detect_cessation.py | test_detect_cessation.py |
| US-030 | FT-7.6 | AF-706 | SF-7061 | recurring/synthesis/estimate_duplicated_effort.py | test_estimate_duplicated_effort.py |
| US-030 | FT-7.6 | AF-706 | SF-7062 | recurring/synthesis/estimate_hours_saved.py | test_estimate_hours_saved.py |
| US-030 | FT-7.6 | AF-706 | SF-7063 | recurring/synthesis/name_removing_artefact.py | test_name_removing_artefact.py |
| US-030 | FT-7.6 | AF-706 | SF-7064 | recurring/synthesis/rank_findings.py | test_rank_findings.py |
| US-030 | FT-7.6 | AF-706 | SF-7065 | recurring/synthesis/assert_non_attributable.py | test_assert_non_attributable.py |
| US-032 | FT-5.1 | AF-501 | SF-5011 | web/src/composer/composerReducer.ts | .test.ts |
| US-032 | FT-5.1 | AF-501 | SF-5012 | web/src/composer/deriveComposerView.ts | .test.ts |
| US-032 | FT-5.1 | AF-501 | SF-5013 | web/src/composer/inspectionDebounce.ts | .test.ts |
| US-032 | FT-5.1 | AF-501 | SF-5014 | web/src/composer/resolvePendingSend.ts | .test.ts |
| US-032 | FT-5.1 | AF-501 | SF-5015 | web/src/composer/Composer.tsx | .test.tsx |
| US-033 | FT-5.2 | AF-502 | SF-5021 | web/src/mirror/buildMirrorModel.ts | .test.ts |
| US-033 | FT-5.2 | AF-502 | SF-5022 | web/src/mirror/buildBlockModel.ts | .test.ts |
| US-033 | FT-5.2 | AF-502 | SF-5023 | web/src/mirror/buildAttributionRow.ts | .test.ts |
| US-033 | FT-5.2 | AF-502 | SF-5024 | web/src/mirror/SubmissionMirror.tsx | .test.tsx |
| US-034 | FT-5.3 | AF-503 | SF-5031 | web/src/reply/buildReplyView.ts | .test.ts |
| US-034 | FT-5.3 | AF-503 | SF-5032 | web/src/reply/buildCopyModel.ts | .test.ts |
| US-034 | FT-5.3 | AF-503 | SF-5033 | web/src/reply/buildRestoreSuggestion.ts | .test.ts |
| US-034 | FT-5.3 | AF-503 | SF-5034 | web/src/reply/ReplyMessage.tsx | .test.tsx |
| US-035 | FT-5.4 | AF-504 | SF-5041 | web/src/provider-view/buildWireTranscriptView.ts | .test.ts |
| US-035 | FT-5.4 | AF-504 | SF-5042 | web/src/provider-view/selectFootnote.ts | .test.ts |
| US-035 | FT-5.4 | AF-504 | SF-5043 | web/src/provider-view/ViewToggle.tsx | .test.tsx |
| US-036 | FT-5.5 | AF-505 | SF-5051 | web/src/i18n/loadStringCatalogue.ts | .test.ts |
| US-036 | FT-5.5 | AF-505 | SF-5052 | web/src/i18n/resolveUiLocale.ts | .test.ts |
| US-036 | FT-5.5 | AF-505 | SF-5053 | web/src/i18n/formatMessage.ts | .test.ts |
| US-036 | FT-5.5 | AF-505 | SF-5054 | web/src/i18n/languageLevels.ts | .test.ts |
| US-037 | FT-5.6 | AF-506 | SF-5061 | web/src/design/motionTokens.ts | .test.ts |
| US-037 | FT-5.6 | AF-506 | SF-5062 | web/src/design/colorTokens.ts | .test.ts |
| US-037 | FT-5.6 | AF-506 | SF-5063 | web/src/design/typeScale.ts | .test.ts |
| US-037 | FT-5.6 | AF-506 | SF-5064 | web/src/design/inspectionSweep.ts | .test.ts |
| US-038 | FT-5.7 | AF-507 | SF-5071 | web/src/report/buildReportForm.ts | .test.ts |
| US-038 | FT-5.7 | AF-507 | SF-5072 | web/src/report/submitReport.ts | .test.ts |
| US-038 | FT-5.7 | AF-507 | SF-5073 | web/src/report/buildReportDone.ts | .test.ts |
| US-038 | FT-5.7 | AF-507 | SF-5074 | web/src/report/buildReporterNotice.ts | .test.ts |
| US-038 | FT-5.7 | AF-507 | SF-5075 | web/src/report/ReportPanel.tsx | .test.tsx |
| US-039 | FT-5.8 | AF-508 | SF-5081 | web/src/rooms/buildThresholdModel.ts | .test.ts |
| US-039 | FT-5.8 | AF-508 | SF-5082 | web/src/rooms/buildManagementShell.ts | .test.ts |
| US-039 | FT-5.8 | AF-508 | SF-5083 | web/src/rooms/buildBriefingView.ts | .test.ts |
| US-039 | FT-5.8 | AF-508 | SF-5084 | web/src/rooms/ManagementView.tsx | .test.tsx |

**Deferred (contract only, no SF rows):**
| US | Epic | Artifact |
|----|------|----------|
| US-C1 | E1 Gateway (browser extension, block-and-warn) | interception **decided**; `core/lib/types.ts` (InterceptionAdapter, InspectionRequest/Verdict) + conformance suite; extension implementation decomposes after E5 |
| US-C3 | E8 Operations | Compose/health/key-storage; dual-key unmask secret store + role binding (NG-20); `core/lib/keyProvider.ts` interface only |

*(US-C2 retired — E5 is decomposed above as US-032…US-039.)*

**Totals:** 39 build stories (30 core + US-031 unmask + US-032…039 E5) · 45 SW
functions in TS core (E2–E4 incl. AF-408, E6) · ~35 SW functions in the E5 web SPA
· 22 SW functions in Python (E7 incl. SF-7065) · plus the shared `core/lib/types.ts`.
Bridges B1–B8 each require an integration test that crosses the boundary.
