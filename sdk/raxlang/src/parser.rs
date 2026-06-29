use crate::ast::*;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ParseError {
    #[error("missing required token: {0}")]
    Missing(&'static str),
    #[error("invalid declaration")]
    InvalidDeclaration,
}

pub fn parse(source: &str) -> Result<Program, ParseError> {
    let mut declarations = Vec::new();
    let trimmed = source.trim();

    if trimmed.lines().any(|l| l.trim().starts_with("agent ")) {
        declarations.push(Declaration::Agent(parse_agent(trimmed)?));
    }

    // ponytail: find all top-level `fn` declarations (skip fn inside agent block)
    let fn_source = strip_agent_block(trimmed);
    for chunk in fn_source.split("\nfn ").skip(1) {
        if let Some(func) = parse_fn(&format!("fn {}", chunk.trim()))? {
            declarations.push(Declaration::Fn(func));
        }
    }

    if declarations.is_empty() {
        return Err(ParseError::InvalidDeclaration);
    }
    Ok(Program { declarations })
}

fn strip_agent_block(src: &str) -> String {
    let Some(start) = src.lines().position(|l| l.trim().starts_with("agent ")) else {
        return src.to_string();
    };
    let lines: Vec<&str> = src.lines().collect();
    let agent_line = lines[start];
    if let Some(block_start) = src.find(agent_line) {
        if let Some(content) = block_after(src, "agent ") {
            let end = block_start + agent_line.len() + content.len() + 2;
            let before = &src[..block_start];
            let after = if end < src.len() { &src[end..] } else { "" };
            return format!("{}{}", before, after);
        }
    }
    src.to_string()
}

fn parse_agent(src: &str) -> Result<AgentDecl, ParseError> {
    let agent_pos = src
        .lines()
        .find_map(|line| {
            let trimmed = line.trim();
            if trimmed.starts_with("agent ") && trimmed.contains('{') {
                Some(trimmed)
            } else {
                None
            }
        })
        .ok_or(ParseError::Missing("agent declaration"))?;
    let name = agent_pos
        .strip_prefix("agent ")
        .and_then(|s| s.split_whitespace().next())
        .ok_or(ParseError::Missing("agent name"))?
        .to_string();

    let domain = between(src, "domain:", ";")
        .ok_or(ParseError::Missing("domain"))?
        .trim()
        .trim_matches('"')
        .to_string();

    let arch = between(src, "arch:", ";").map(|s| s.trim().to_string());

    let process_block_raw =
        block_after(src, "process(").ok_or(ParseError::Missing("process block"))?;
    let process_body = parse_block(process_block_raw)?;

    Ok(AgentDecl {
        name,
        domain,
        arch,
        process_body,
    })
}

fn parse_fn(src: &str) -> Result<Option<FnDecl>, ParseError> {
    let fn_pos = if let Some(pos) = src.find("fn ") {
        pos
    } else {
        return Ok(None);
    };
    let rem = &src[fn_pos + 3..];
    let name = rem
        .split('(')
        .next()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or(ParseError::Missing("function name"))?
        .to_string();

    let params_raw = between(rem, "(", ")").ok_or(ParseError::Missing("function params"))?;
    let params = parse_params(params_raw);
    let return_type = rem
        .split("->")
        .nth(1)
        .and_then(|s| s.split('{').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToString::to_string);
    let body_raw = block_after(rem, "{").ok_or(ParseError::Missing("function body"))?;
    let body = parse_block(body_raw)?;

    Ok(Some(FnDecl {
        name,
        params,
        return_type,
        body,
    }))
}

fn parse_params(raw: &str) -> Vec<Param> {
    raw.split(',')
        .filter_map(|part| {
            let p = part.trim();
            if p.is_empty() {
                return None;
            }
            let mut it = p.split(':');
            let name = it.next()?.trim().to_string();
            let type_expr = it.next()?.trim().to_string();
            Some(Param { name, type_expr })
        })
        .collect()
}

fn parse_block(raw: &str) -> Result<Block, ParseError> {
    let mut statements = Vec::new();
    let mut return_expr = None;

    for line in raw.lines().map(str::trim) {
        if line.is_empty() || line.starts_with("//") {
            continue;
        }
        if let Some(rest) = line.strip_prefix("let ") {
            let mut parts = rest.split('=');
            let name = parts
                .next()
                .ok_or(ParseError::InvalidDeclaration)?
                .trim()
                .trim_end_matches(';')
                .to_string();
            let value = parts
                .next()
                .ok_or(ParseError::InvalidDeclaration)?
                .trim()
                .trim_end_matches(';');
            statements.push(Statement::Let {
                name,
                value: parse_expr(value),
            });
        } else if let Some(rest) = line.strip_prefix("return ") {
            let expr = parse_expr(rest.trim_end_matches(';'));
            statements.push(Statement::Return(expr.clone()));
            return_expr = Some(expr);
        } else if line.ends_with(';') {
            statements.push(Statement::Expr(parse_expr(line.trim_end_matches(';'))));
        }
    }

    Ok(Block {
        statements,
        return_expr,
    })
}

fn parse_expr(raw: &str) -> Expr {
    let expr = raw.trim();
    if expr.starts_with('"') && expr.ends_with('"') {
        return Expr::StringLit(expr.trim_matches('"').to_string());
    }
    if let Some(idx) = expr.find('(') {
        if expr.ends_with(')') {
            let name = expr[..idx].trim().to_string();
            let args_raw = &expr[idx + 1..expr.len() - 1];
            let args = if args_raw.trim().is_empty() {
                Vec::new()
            } else {
                args_raw.split(',').map(parse_expr).collect()
            };
            return Expr::Call { name, args };
        }
    }
    Expr::Ident(expr.to_string())
}

fn between<'a>(src: &'a str, start: &str, end: &str) -> Option<&'a str> {
    let from = src.find(start)?;
    let rem = &src[from + start.len()..];
    let to = rem.find(end)?;
    Some(&rem[..to])
}

fn block_after<'a>(src: &'a str, marker: &str) -> Option<&'a str> {
    let marker_pos = src.find(marker)?;
    let open_pos = src[marker_pos..].find('{')? + marker_pos;
    let mut depth = 0;
    for (i, c) in src[open_pos..].char_indices() {
        match c {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(&src[open_pos + 1..open_pos + i]);
                }
            }
            _ => {}
        }
    }
    None
}
