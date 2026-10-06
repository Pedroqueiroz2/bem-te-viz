import { test } from "node:test";
import assert from "node:assert/strict";
import { stopAudioElements } from "../src/audio-playback.js";

test("pauses, rewinds, and releases every audio element", () => {
  const calls = [];
  const audioElements = [
    {
      pause: () => calls.push("pause-1"),
      currentTime: 12,
      removeAttribute: (name) => calls.push(`remove-1:${name}`),
      load: () => calls.push("load-1"),
    },
    {
      pause: () => calls.push("pause-2"),
      currentTime: 8,
      removeAttribute: (name) => calls.push(`remove-2:${name}`),
      load: () => calls.push("load-2"),
    },
  ];

  stopAudioElements({ querySelectorAll: () => audioElements });

  assert.deepEqual(calls, [
    "pause-1",
    "remove-1:src",
    "load-1",
    "pause-2",
    "remove-2:src",
    "load-2",
  ]);
  assert.equal(audioElements[0].currentTime, 0);
  assert.equal(audioElements[1].currentTime, 0);
});

test("still releases audio when resetting currentTime is unavailable", () => {
  const calls = [];
  const audio = {
    pause: () => calls.push("pause"),
    get currentTime() {
      throw new Error("metadata unavailable");
    },
    removeAttribute: (name) => calls.push(`remove:${name}`),
    load: () => calls.push("load"),
  };

  stopAudioElements({ querySelectorAll: () => [audio] });

  assert.deepEqual(calls, ["pause", "remove:src", "load"]);
});
