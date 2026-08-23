mod app;
mod logs;
mod ui;

use app::App;
use logs::Logs;

fn main() -> std::io::Result<()> {
    let logs = Logs::default();
    logs.install();

    log::info!("patka starting");

    let terminal = ratatui::init();

    let result = App::new(logs).run(terminal);

    ratatui::restore();

    result
}
