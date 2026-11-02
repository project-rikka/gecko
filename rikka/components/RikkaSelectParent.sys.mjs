/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  EventDispatcher: "resource://gre/modules/Messaging.sys.mjs",
});

let lastId = 0;

function viewRect(window, browser, rect) {
  const box = browser.getBoundingClientRect();
  const left = rect.left - window.mozInnerScreenX - box.left;
  const top = rect.top - window.mozInnerScreenY - box.top;
  return { left, top, right: left + rect.width, bottom: top + rect.height };
}

function optionOf(option, groupDisabled) {
  return {
    kind: "option",
    index: option.index,
    label: option.textContent,
    disabled: groupDisabled || option.disabled,
    tooltip: option.tooltip || null,
  };
}

function shown(option) {
  return option.display !== "none";
}

function itemsOf(options) {
  return options.filter(shown).map(option => {
    if (option.isHR) {
      return { kind: "separator" };
    }
    if (option.isOptGroup) {
      return {
        kind: "group",
        label: option.textContent,
        disabled: option.disabled,
        options: option.children
          .filter(child => shown(child) && !child.isHR && !child.isOptGroup)
          .map(child => optionOf(child, option.disabled)),
      };
    }
    return optionOf(option, false);
  });
}

function selectedOf(index) {
  return Number.isInteger(index) && index >= 0 ? index : null;
}

export class SelectParent extends JSWindowActorParent {
  #shown = null;

  receiveMessage({ name, data }) {
    switch (name) {
      case "Forms:ShowDropDown":
        this.#show(data);
        break;
      case "Forms:UpdateDropDown":
        this.#tell("Rikka:View:DropdownUpdated", {
          items: itemsOf(data.options.options),
          selected: selectedOf(data.selectedIndex),
        });
        break;
      case "Forms:HideDropDown":
        this.#hide();
        break;
      case "Forms:BlurDropDown-Ping":
        if (this.#shown) {
          this.sendAsyncMessage("Forms:BlurDropDown-Pong", {});
        }
        break;
    }
  }

  didDestroy() {
    this.#hide();
  }

  #show(data) {
    const window = this.browsingContext.topChromeWindow;
    const browser = this.browsingContext.top.embedderElement;
    if (!window || window.closed || !browser || !this.browsingContext.canOpenModalPicker) {
      this.sendAsyncMessage("Forms:DismissedDropDown", {});
      return;
    }
    const id = ++lastId;
    this.#shown = { id, window };
    lazy.EventDispatcher.for(window)
      .sendRequestForResult("Rikka:View:Dropdown", {
        id,
        rect: viewRect(window, browser, data.rect),
        items: itemsOf(data.options.options),
        selected: selectedOf(data.selectedIndex),
      })
      .then(
        choice => this.#close(id, choice),
        () => this.#close(id, null)
      );
  }

  #close(id, choice) {
    if (this.#shown?.id !== id) {
      return;
    }
    this.#shown = null;
    if (Number.isInteger(choice?.index)) {
      this.sendAsyncMessage("Forms:SelectDropDownItem", {
        value: choice.index,
        closedWithEnter: choice.with === "keyboard",
      });
    }
    this.sendAsyncMessage("Forms:DismissedDropDown", {});
  }

  #hide() {
    this.#tell("Rikka:View:DropdownHidden", {});
    this.#shown = null;
  }

  #tell(event, data) {
    if (!this.#shown || this.#shown.window.closed) {
      return;
    }
    const { id, window } = this.#shown;
    lazy.EventDispatcher.for(window).sendRequest(event, { id, ...data });
  }
}
