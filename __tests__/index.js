// @flow
/* global expect */

import foo from "../index.js";

describe("A test", () => {
    it("works", () => {
        expect(foo()).toBe(1);
    });
});
