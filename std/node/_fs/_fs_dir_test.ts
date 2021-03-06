const { test } = Deno;
import { assert, assertEquals, fail } from "../../testing/asserts.ts";
import Dir from "./_fs_dir.ts";
import Dirent from "./_fs_dirent.ts";

test({
  name: "Closing current directory with callback is successful",
  async fn() {
    let calledBack = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new Dir(".").close((valOrErr: any) => {
      assert(!valOrErr);
      calledBack = true;
    });
    assert(calledBack);
  }
});

test({
  name: "Closing current directory without callback returns void Promise",
  async fn() {
    await new Dir(".").close();
  }
});

test({
  name: "Closing current directory synchronously works",
  async fn() {
    new Dir(".").closeSync();
  }
});

test({
  name: "Path is correctly returned",
  fn() {
    assertEquals(new Dir("std/node").path, "std/node");

    const enc: Uint8Array = new TextEncoder().encode("std/node");
    assertEquals(new Dir(enc).path, "std/node");
  }
});

test({
  name: "read returns null for empty directory",
  async fn() {
    const testDir: string = Deno.makeTempDirSync();
    try {
      const file: Dirent | null = await new Dir(testDir).read();
      assert(file === null);

      let calledBack = false;
      const fileFromCallback: Dirent | null = await new Dir(
        testDir
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).read((err: any, res: Dirent) => {
        assert(res === null);
        assert(err === null);
        calledBack = true;
      });
      assert(fileFromCallback === null);
      assert(calledBack);

      assertEquals(new Dir(testDir).readSync(), null);
    } finally {
      Deno.removeSync(testDir);
    }
  }
});

test({
  name: "Async read returns one file at a time",
  async fn() {
    const testDir: string = Deno.makeTempDirSync();
    const f1 = Deno.createSync(testDir + "/foo.txt");
    f1.close();
    const f2 = Deno.createSync(testDir + "/bar.txt");
    f2.close();

    try {
      let secondCallback = false;
      const dir: Dir = new Dir(testDir);
      const firstRead: Dirent | null = await dir.read();
      const secondRead: Dirent | null = await dir.read(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any, secondResult: Dirent) => {
          assert(
            secondResult.name === "bar.txt" || secondResult.name === "foo.txt"
          );
          secondCallback = true;
        }
      );
      const thirdRead: Dirent | null = await dir.read();

      if (firstRead?.name === "foo.txt") {
        assertEquals(secondRead?.name, "bar.txt");
      } else if (firstRead?.name === "bar.txt") {
        assertEquals(secondRead?.name, "foo.txt");
      } else {
        fail("File not found during read");
      }
      assert(secondCallback);
      assert(thirdRead === null);
    } finally {
      Deno.removeSync(testDir, { recursive: true });
    }
  }
});

test({
  name: "Sync read returns one file at a time",
  fn() {
    const testDir: string = Deno.makeTempDirSync();
    const f1 = Deno.createSync(testDir + "/foo.txt");
    f1.close();
    const f2 = Deno.createSync(testDir + "/bar.txt");
    f2.close();

    try {
      const dir: Dir = new Dir(testDir);
      const firstRead: Dirent | null = dir.readSync();
      const secondRead: Dirent | null = dir.readSync();
      const thirdRead: Dirent | null = dir.readSync();

      if (firstRead?.name === "foo.txt") {
        assertEquals(secondRead?.name, "bar.txt");
      } else if (firstRead?.name === "bar.txt") {
        assertEquals(secondRead?.name, "foo.txt");
      } else {
        fail("File not found during read");
      }
      assert(thirdRead === null);
    } finally {
      Deno.removeSync(testDir, { recursive: true });
    }
  }
});

test({
  name: "Async iteration over existing directory",
  async fn() {
    const testDir: string = Deno.makeTempDirSync();
    const f1 = Deno.createSync(testDir + "/foo.txt");
    f1.close();
    const f2 = Deno.createSync(testDir + "/bar.txt");
    f2.close();

    try {
      const dir: Dir = new Dir(testDir);
      const results: Array<string | null> = [];

      for await (const file of dir[Symbol.asyncIterator]()) {
        results.push(file.name);
      }

      assert(results.length === 2);
      assert(results.includes("foo.txt"));
      assert(results.includes("bar.txt"));
    } finally {
      Deno.removeSync(testDir, { recursive: true });
    }
  }
});
