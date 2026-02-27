use std::fs;
use std::path::PathBuf;

use clap::Parser;

#[derive(Parser)]
#[command(name = "raxlang", about = "RaxLang v0.1 compiler")]
struct Cli {
    /// Input .rax file
    input: PathBuf,
    /// Output .rs file (default: <input>.rs)
    #[arg(short, long)]
    output: Option<PathBuf>,
    /// Check syntax only
    #[arg(long)]
    check: bool,
}

fn main() {
    let cli = Cli::parse();
    let source = fs::read_to_string(&cli.input).unwrap_or_else(|err| {
        eprintln!("failed to read {}: {err}", cli.input.display());
        std::process::exit(1);
    });

    let ast = match raxlang::parser::parse(&source) {
        Ok(ast) => ast,
        Err(err) => {
            eprintln!("parse error: {err}");
            std::process::exit(1);
        }
    };

    if cli.check {
        println!("✅ Syntax OK: {}", cli.input.display());
        return;
    }

    let mut transpiler = raxlang::transpiler::Transpiler::new();
    let rust_code = transpiler.transpile_program(&ast);
    let out = cli.output.unwrap_or_else(|| cli.input.with_extension("rs"));
    if let Err(err) = fs::write(&out, rust_code) {
        eprintln!("failed to write {}: {err}", out.display());
        std::process::exit(1);
    }
    println!(
        "✅ Transpiled: {} -> {}",
        cli.input.display(),
        out.display()
    );
}
