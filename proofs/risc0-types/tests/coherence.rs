use risc0_types::coherence::{
    approximate_cc_from_agreement, category_for_score, compute_coherence_from_components,
    geometric_mean, ConvergenceCategory, ALPHA, BETA, THRESHOLD_HIGH, THRESHOLD_REJECT,
    THRESHOLD_STANDARD, W_CONCLUSION, W_ENTAILMENT, W_PREMISE,
};
use serde::Deserialize;

const EPS: f64 = 1e-9;

#[derive(Debug, Deserialize)]
struct FixtureCase {
    name: String,
    sim_ts: f64,
    sim_tn: f64,
    sim_sn: f64,
    cc_approximate: f64,
    cs_semantic: f64,
    score: f64,
    category: String,
}

fn parse_category(value: &str) -> ConvergenceCategory {
    match value {
        "REJECTED" => ConvergenceCategory::Rejected,
        "LOW_CONFIDENCE" => ConvergenceCategory::LowConfidence,
        "STANDARD" => ConvergenceCategory::Standard,
        "HIGH_COHERENCE" => ConvergenceCategory::HighCoherence,
        other => panic!("Unknown category value in fixture: {other}"),
    }
}

fn clamp01(value: f64) -> f64 {
    value.clamp(0.0, 1.0)
}

#[test]
fn protocol_constants_are_stable() {
    assert!((ALPHA - 0.4).abs() < EPS);
    assert!((BETA - 0.6).abs() < EPS);
    assert!((ALPHA + BETA - 1.0).abs() < EPS);
    assert!((W_PREMISE - 0.3).abs() < EPS);
    assert!((W_CONCLUSION - 0.5).abs() < EPS);
    assert!((W_ENTAILMENT - 0.2).abs() < EPS);
    assert!((THRESHOLD_REJECT - 0.30).abs() < EPS);
    assert!((THRESHOLD_STANDARD - 0.60).abs() < EPS);
    assert!((THRESHOLD_HIGH - 0.85).abs() < EPS);
}

#[test]
fn geometric_mean_matches_reference_behavior() {
    assert!((geometric_mean(&[]) - 0.0).abs() < EPS);
    assert!((geometric_mean(&[0.5, 0.5, 0.5]) - 0.5).abs() < EPS);
    assert!((geometric_mean(&[1.0, 1.0, 1.0]) - 1.0).abs() < EPS);
    assert!((geometric_mean(&[0.0, 0.8, 0.8]) - 0.0).abs() < EPS);

    let geo = geometric_mean(&[0.9, 0.9, 0.1]);
    let arith = (0.9 + 0.9 + 0.1) / 3.0;
    assert!(geo < arith);
}

#[test]
fn approximate_cc_from_agreement_is_identity_like() {
    assert!((approximate_cc_from_agreement(0.0) - 0.0).abs() < EPS);
    assert!((approximate_cc_from_agreement(0.25) - 0.25).abs() < EPS);
    assert!((approximate_cc_from_agreement(0.5) - 0.5).abs() < EPS);
    assert!((approximate_cc_from_agreement(1.0) - 1.0).abs() < EPS);
}

#[test]
fn score_component_formula_is_exact() {
    let sim_ts_raw = 0.7;
    let sim_tn_raw = 0.8;
    let sim_sn_raw = 0.9;
    let cc_raw = 0.75;
    let result = compute_coherence_from_components(sim_ts_raw, sim_tn_raw, sim_sn_raw, cc_raw);

    let recomputed_cs_semantic = geometric_mean(&[
        clamp01(sim_ts_raw),
        clamp01(sim_tn_raw),
        clamp01(sim_sn_raw),
    ]);
    let recomputed_cc_approximate = clamp01(cc_raw);
    let expected = ALPHA * recomputed_cs_semantic + BETA * recomputed_cc_approximate;

    assert!((result.cs_semantic - recomputed_cs_semantic).abs() < EPS);
    assert!((result.cc_approximate - recomputed_cc_approximate).abs() < EPS);
    assert!((result.score - expected).abs() < EPS);
}

#[test]
fn threshold_categories_match_spec() {
    assert_eq!(category_for_score(0.29), ConvergenceCategory::Rejected);
    assert_eq!(category_for_score(0.30), ConvergenceCategory::LowConfidence);
    assert_eq!(category_for_score(0.59), ConvergenceCategory::LowConfidence);
    assert_eq!(category_for_score(0.60), ConvergenceCategory::Standard);
    assert_eq!(category_for_score(0.84), ConvergenceCategory::Standard);
    assert_eq!(category_for_score(0.85), ConvergenceCategory::HighCoherence);
}

#[test]
fn coherence_result_is_final_matches_threshold_gate() {
    let low = compute_coherence_from_components(0.2, 0.2, 0.2, 0.2);
    assert!(!low.is_final());

    let high = compute_coherence_from_components(1.0, 1.0, 1.0, 1.0);
    assert!(high.is_final());

    let boundary = compute_coherence_from_components(0.0, 0.0, 0.0, THRESHOLD_STANDARD / BETA);
    assert!((boundary.score - THRESHOLD_STANDARD).abs() < EPS);
    assert!(boundary.is_final());
}

#[test]
fn rust_matches_python_fixtures_within_tolerance() {
    let fixture_text = include_str!("fixtures/coherence_python_fixtures.json");
    let fixtures: Vec<FixtureCase> =
        serde_json::from_str(fixture_text).expect("fixture JSON should parse");
    assert!(
        !fixtures.is_empty(),
        "fixture file tests/fixtures/coherence_python_fixtures.json is empty"
    );

    for fixture in fixtures {
        let result = compute_coherence_from_components(
            fixture.sim_ts,
            fixture.sim_tn,
            fixture.sim_sn,
            fixture.cc_approximate,
        );

        assert!(
            (result.cs_semantic - fixture.cs_semantic).abs() < EPS,
            "{}: cs_semantic mismatch",
            fixture.name
        );
        assert!(
            (result.score - fixture.score).abs() < EPS,
            "{}: score mismatch",
            fixture.name
        );
        assert_eq!(
            result.category,
            parse_category(&fixture.category),
            "{}: category mismatch",
            fixture.name
        );
    }
}
