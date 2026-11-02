use serde::{Deserialize, Serialize};

use crate::geckoview::geometry::Rect;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct DropdownId(pub u64);

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DropdownOption {
    pub index: u32,
    pub label: String,
    pub disabled: bool,
    pub tooltip: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DropdownGroup {
    pub label: String,
    pub disabled: bool,
    pub options: Vec<DropdownOption>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum DropdownItem {
    Option(DropdownOption),
    Group(DropdownGroup),
    Separator,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ShowDropdown {
    pub id: DropdownId,
    pub rect: Rect,
    pub items: Vec<DropdownItem>,
    pub selected: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UpdateDropdown {
    pub id: DropdownId,
    pub items: Vec<DropdownItem>,
    pub selected: Option<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct HideDropdown {
    pub id: DropdownId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChosenWith {
    Pointer,
    Keyboard,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct DropdownChoice {
    pub index: u32,
    pub with: ChosenWith,
}

events! {
    ShowDropdown: "Rikka:View:Dropdown" => ForEmbedder -> Option<DropdownChoice>;
    UpdateDropdown: "Rikka:View:DropdownUpdated" => ForEmbedder;
    HideDropdown: "Rikka:View:DropdownHidden" => ForEmbedder;
}
