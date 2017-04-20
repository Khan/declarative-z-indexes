// @flow
/* global expect */
import LayerSolver from "../index.js";

describe("LayerSolver", () => {
    it("solves simple constraints", () => {
        const solver = new LayerSolver();

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");

        a.isAbove(b);

        const solution = solver.solve();

        expect(solution.a).toBeGreaterThan(solution.b);
    });

    it("solves more complex constraints", () => {
        const solver = new LayerSolver();

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");
        const c = solver.addLayer("c");

        a.isAbove(b);
        a.isAbove(c);
        b.isAbove(c);

        const solution = solver.solve();

        expect(solution.a).toBeGreaterThan(solution.b);
        expect(solution.a).toBeGreaterThan(solution.c);
        expect(solution.b).toBeGreaterThan(solution.c);
    });

    it("bails out when there is a cycle", () => {
        const solver = new LayerSolver();

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");
        const c = solver.addLayer("c");

        a.isAbove(b);
        b.isAbove(c);
        c.isAbove(a);

        expect(() => {
            solver.solve();
        }).toThrow("Cycle detected!");
    });

    it("allows for static layers", () => {
        const solver = new LayerSolver();

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");
        const preExisting = solver.addStaticLayer("preExisting", 100);

        a.isAbove(preExisting);
        b.isBelow(preExisting);

        const solution = solver.solve();

        expect(solution.preExisting).toEqual(100);
        expect(solution.a).toBeGreaterThan(solution.preExisting);
        expect(solution.preExisting).toBeGreaterThan(solution.b);
    });

    it("bails out if two static layers conflict with one another", () => {
        const solver = new LayerSolver();

        const a = solver.addStaticLayer("a", 100);
        const b = solver.addStaticLayer("b", 50);

        b.isAbove(a);

        expect(() => {
            solver.solve();
        }).toThrow(
            "A static layer is conflicting with another static layer or the " +
            "minimum layer value (1)."
        );
    });

    it("allows two z-indices to be the same", () => {
        const solver = new LayerSolver();

        const top = solver.addStaticLayer("top", 4);
        const bottom = solver.addStaticLayer("bottom", 2);

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");

        top.isAbove(a);
        top.isAbove(b);
        bottom.isBelow(a);
        bottom.isBelow(b);

        const solution = solver.solve();

        expect(solution.top).toBeGreaterThan(solution.a);
        expect(solution.top).toBeGreaterThan(solution.b);
        expect(solution.a).toBeGreaterThan(solution.bottom);
        expect(solution.b).toBeGreaterThan(solution.bottom);
    });

    it("can solve() multiple times", () => {
        const solver = new LayerSolver();

        expect(solver.solve()).toEqual({});
        expect(solver.solve()).toEqual({});

        const old = solver.solve();

        const a = solver.addLayer("a");
        const b = solver.addLayer("b");

        a.isAbove(b);

        const solution = solver.solve();

        // New constraints are followed
        expect(solution.a).toBeGreaterThan(solution.b);

        // The same solution is generated every time solve() is called with the
        // same constraints.
        expect(solver.solve()).toEqual(solution);

        // Old solutions aren't changed by calling solve()
        expect(Object.keys(old).length).toEqual(0);
    });
});
