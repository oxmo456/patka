use ratatui::layout::Rect;
use ratatui::text::Line;

/// Grows content from the bottom of `area`: short content is padded with blank
/// lines above, and once it overflows the oldest lines scroll off the top.
pub fn pin_to_bottom<'a>(lines: Vec<Line<'a>>, area: Rect) -> (Vec<Line<'a>>, u16) {
    let height = area.height.saturating_sub(2) as usize;

    if let Some(overflow) = lines.len().checked_sub(height) {
        return (lines, overflow as u16);
    }

    let mut padded = vec![Line::raw(""); height - lines.len()];
    padded.extend(lines);
    (padded, 0)
}
