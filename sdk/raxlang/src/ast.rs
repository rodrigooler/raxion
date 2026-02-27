#[derive(Debug, Clone)]
pub struct Program {
    pub declarations: Vec<Declaration>,
}

#[derive(Debug, Clone)]
pub enum Declaration {
    Agent(AgentDecl),
    Fn(FnDecl),
}

#[derive(Debug, Clone)]
pub struct AgentDecl {
    pub name: String,
    pub domain: String,
    pub arch: Option<String>,
    pub process_body: Block,
}

#[derive(Debug, Clone)]
pub struct FnDecl {
    pub name: String,
    pub params: Vec<Param>,
    pub return_type: Option<String>,
    pub body: Block,
}

#[derive(Debug, Clone)]
pub struct Param {
    pub name: String,
    pub type_expr: String,
}

#[derive(Debug, Clone)]
pub struct Block {
    pub statements: Vec<Statement>,
    pub return_expr: Option<Expr>,
}

#[derive(Debug, Clone)]
pub enum Statement {
    Let { name: String, value: Expr },
    Return(Expr),
    Expr(Expr),
}

#[derive(Debug, Clone)]
pub enum Expr {
    Ident(String),
    StringLit(String),
    Call { name: String, args: Vec<Expr> },
}
