use std::sync::{Arc, Mutex, MutexGuard};

use log::{Level, LevelFilter, Log, Metadata, Record};

#[derive(Clone, Default)]
pub struct Logs {
    records: Arc<Mutex<Vec<(Level, String)>>>,
}

impl Logs {
    pub fn install(&self) {
        log::set_logger(Box::leak(Box::new(self.clone()))).expect("logger already set");
        log::set_max_level(LevelFilter::Info);
    }

    pub fn records(&self) -> MutexGuard<'_, Vec<(Level, String)>> {
        self.records.lock().unwrap()
    }
}

impl Log for Logs {
    fn enabled(&self, _: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        self.records
            .lock()
            .unwrap()
            .push((record.level(), record.args().to_string()));
    }

    fn flush(&self) {}
}
