import Vuex from "vuex";
import { default as Masthead } from "./Masthead.vue";
import { mount } from "@vue/test-utils";
import { getLocalVue } from "tests/jest/helpers";
import { WindowManager } from "layout/window-manager";
import { loadWebhookMenuItems } from "./_webhooks";
import { userStore } from "store/userStore";
import { configStore } from "store/configStore";
import { getActiveTab } from "./utilities";

jest.mock("app");
jest.mock("./_webhooks");
jest.mock("vue-router/composables", () => ({
    useRoute: jest.fn(() => ({ name: "Home" })),
}));

describe("Masthead.vue", () => {
    let wrapper;
    let localVue;
    let windowManager;
    let tabs;
    let store;
    let state;
    let actions;

    function stubLoadWebhooks(items) {
        items.push({
            id: "extension",
            title: "Extension Point",
            menu: false,
            url: "extension_url",
        });
    }

    loadWebhookMenuItems.mockImplementation(stubLoadWebhooks);

    beforeEach(() => {
        localVue = getLocalVue();

        store = new Vuex.Store({
            modules: {
                user: {
                    state,
                    actions: {
                        loadUser: jest.fn(),
                    },
                    getters: userStore.getters,
                    namespaced: true,
                },
                config: {
                    state,
                    actions,
                    getters: configStore.getters,
                    namespaced: true,
                },
            },
        });

        tabs = [
            // Main Analysis Tab..
            {
                id: "analysis",
                title: "Analyze",
                menu: false,
                url: "root",
            },
            {
                id: "shared",
                title: "Shared Items",
                menu: [{ title: "_menu_title", url: "_menu_url", target: "_menu_target" }],
            },
            // Hidden tab (pre-Vue framework supported this, not sure it is used
            // anywhere?)
            {
                id: "hiddentab",
                title: "Hidden Title",
                menu: false,
                hidden: true,
            },
        ];

        const initialActiveTab = "shared";
        windowManager = new WindowManager({});
        const windowTab = windowManager.getTab();
        wrapper = mount(Masthead, {
            propsData: {
                tabs,
                windowTab,
                initialActiveTab,
            },
            store,
            localVue,
        });
    });

    it("test basic active tab matching", () => {
        expect(getActiveTab("root", tabs)).toBe("analysis");
        expect(getActiveTab("_menu_url", tabs)).toBe("shared");
    });

    it("should render simple tab item links", () => {
        expect(wrapper.findAll("li.nav-item").length).toBe(5);
        // Ensure specified link title respected.
        expect(wrapper.find("#analysis a").text()).toBe("Analyze");
        expect(wrapper.find("#analysis a").attributes("href")).toBe("root");
    });

    it("should render tab items with menus", () => {
        // Ensure specified link title respected.
        expect(wrapper.find("#shared a").text()).toBe("Shared Items");
        expect(wrapper.find("#shared").classes("dropdown")).toBe(true);

        expect(wrapper.findAll("#shared .dropdown-menu li").length).toBe(1);
        expect(wrapper.find("#shared .dropdown-menu li a").attributes().href).toBe("_menu_url");
        expect(wrapper.find("#shared .dropdown-menu li a").attributes().target).toBe("_menu_target");
        expect(wrapper.find("#shared .dropdown-menu li a").text()).toBe("_menu_title");
    });

    it("should make hidden tabs hidden", () => {
        expect(wrapper.find("#analysis").attributes().style).not.toEqual(expect.stringContaining("display: none"));
        expect(wrapper.find("#hiddentab").attributes().style).toEqual(expect.stringContaining("display: none"));
    });

    it("should highlight the active tab", () => {
        expect(wrapper.find("#analysis").classes("active")).toBe(false);
        expect(wrapper.find("#shared").classes("active")).toBe(true);
    });

    it("should display window manager button", async () => {
        expect(wrapper.find("#enable-window-manager a span.fa-th").exists()).toBe(true);
        expect(windowManager.active).toBe(false);
        await wrapper.find("#enable-window-manager a").trigger("click");
        expect(windowManager.active).toBe(true);
    });

    it("should load webhooks on creation", async () => {
        expect(wrapper.find("#extension a").text()).toBe("Extension Point");
    });
});
