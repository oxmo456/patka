use ratatui::layout::Rect;

pub fn scroll_to_bottom(len: usize, area: Rect) -> u16 {
    let visible = area.height.saturating_sub(2) as usize;
    len.saturating_sub(visible) as u16
}
