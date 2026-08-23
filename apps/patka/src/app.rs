use log::Level;
use ratatui::crossterm::event::{self, Event, KeyCode, KeyEventKind, KeyModifiers};
use ratatui::layout::{Constraint, Layout, Rect};
use ratatui::style::{Color, Style, Stylize};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Paragraph};
use ratatui::{DefaultTerminal, Frame};

use crate::logs::Logs;
use crate::ui::scroll_to_bottom;

enum KeyPressedAction {
    Quit,
    SendMessage,
    DeleteLastChar,
    InsertChar(char),
    None,
}

pub struct App {
    input: String,
    messages: Vec<String>,
    logs: Logs,
}

impl App {
    pub fn new(logs: Logs) -> Self {
        Self {
            input: String::new(),
            messages: Vec::new(),
            logs,
        }
    }

    pub fn run(mut self, mut terminal: DefaultTerminal) -> std::io::Result<()> {
        loop {
            terminal.draw(|frame| self.draw(frame))?;

            match self.handle_key_pressed()? {
                KeyPressedAction::Quit => return Ok(()),
                KeyPressedAction::SendMessage => self.send_message(),
                KeyPressedAction::DeleteLastChar => {
                    self.input.pop();
                }
                KeyPressedAction::InsertChar(c) => self.input.push(c),
                KeyPressedAction::None => {}
            }
        }
    }

    fn handle_key_pressed(&self) -> std::io::Result<KeyPressedAction> {
        let Event::Key(key) = event::read()? else {
            return Ok(KeyPressedAction::None);
        };
        if key.kind != KeyEventKind::Press {
            return Ok(KeyPressedAction::None);
        }

        Ok(match key.code {
            KeyCode::Esc => KeyPressedAction::Quit,
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                KeyPressedAction::Quit
            }
            KeyCode::Enter => KeyPressedAction::SendMessage,
            KeyCode::Backspace => KeyPressedAction::DeleteLastChar,
            KeyCode::Char(c) => KeyPressedAction::InsertChar(c),
            _ => KeyPressedAction::None,
        })
    }

    fn send_message(&mut self) {
        if self.input.is_empty() {
            return;
        }
        let message = std::mem::take(&mut self.input);
        log::info!("message submitted ({} chars)", message.len());
        self.messages.push(message);
    }

    fn draw(&self, frame: &mut Frame) {
        let [chat, logs] = Layout::horizontal([Constraint::Percentage(50); 2]).areas(frame.area());

        self.draw_chat(frame, chat);
        self.draw_logs(frame, logs);
    }

    fn draw_chat(&self, frame: &mut Frame, area: Rect) {
        let [history, input] =
            Layout::vertical([Constraint::Min(0), Constraint::Length(3)]).areas(area);

        frame.render_widget(
            Paragraph::new(self.messages.join("\n"))
                .block(Block::bordered().title("Chat"))
                .scroll((scroll_to_bottom(self.messages.len(), history), 0)),
            history,
        );
        frame.render_widget(
            Paragraph::new(self.input.as_str())
                .block(Block::bordered().title("Input (Enter to send, Esc/Ctrl+C to quit)")),
            input,
        );
        frame.set_cursor_position((input.x + 1 + self.input.len() as u16, input.y + 1));
    }

    fn draw_logs(&self, frame: &mut Frame, area: Rect) {
        let records = self.logs.records();
        let lines: Vec<Line> = records
            .iter()
            .map(|(level, message)| {
                Line::from(vec![
                    Span::styled(format!("{level:<5} "), Style::new().fg(level_color(*level))),
                    Span::raw(message),
                ])
            })
            .collect();

        frame.render_widget(
            Paragraph::new(lines)
                .block(Block::bordered().title("Agent logs".dim()))
                .scroll((scroll_to_bottom(records.len(), area), 0)),
            area,
        );
    }
}

fn level_color(level: Level) -> Color {
    match level {
        Level::Error => Color::Red,
        Level::Warn => Color::Yellow,
        Level::Info => Color::Green,
        Level::Debug | Level::Trace => Color::Gray,
    }
}
