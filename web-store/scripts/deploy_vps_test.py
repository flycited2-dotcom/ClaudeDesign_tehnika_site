import unittest

from scripts.deploy_vps import (
    build_connect_kwargs,
    build_remote_deploy_script,
    printable_tail,
    public_healthcheck,
    run_remote_command,
    should_include_archive_path,
)


class _ReadyChannel:
    def exit_status_ready(self):
        return True

    def recv_exit_status(self):
        return 0


class _FakeStream:
    def __init__(self, payload: bytes):
        self.channel = _ReadyChannel()
        self._payload = payload

    def read(self):
        return self._payload


class _FakeClient:
    def __init__(self):
        self.exec_command_kwargs = None

    def exec_command(self, command, **kwargs):
        self.exec_command_kwargs = kwargs
        return None, _FakeStream(b"ok"), _FakeStream(b"")


class _FakeResponse:
    def __init__(self, status: int):
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False


class DeployVpsTests(unittest.TestCase):
    def test_archive_excludes_local_builds_dependencies_and_secrets(self):
        excluded = [
            ".env",
            ".env.local",
            ".next/BUILD_ID",
            "node_modules/next/package.json",
            "dev-server.out.log",
            "__pycache__/deploy.pyc",
        ]
        for path in excluded:
            with self.subTest(path=path):
                self.assertFalse(should_include_archive_path(path))

        included = [
            "src/app/catalog/catalog-view.tsx",
            "package.json",
            "package-lock.json",
            "scripts/sync-products.ts",
            "HANDOFF.md",
        ]
        for path in included:
            with self.subTest(path=path):
                self.assertTrue(should_include_archive_path(path))

    def test_remote_script_builds_before_restart_and_checks_health(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
        )

        build_index = script.index("npm run build")
        generate_index = script.index("npx prisma generate")
        manifest_index = script.index(".next/prerender-manifest.json")
        restart_index = script.index("pm2 delete climat-simf-store")
        health_index = script.index("curl -fsS -m 30 http://127.0.0.1:3001/")

        self.assertLess(generate_index, build_index)
        self.assertLess(build_index, manifest_index)
        self.assertLess(manifest_index, restart_index)
        self.assertLess(restart_index, health_index)
        self.assertIn("set -euo pipefail", script)
        self.assertIn("for attempt in 1 2 3 4 5 6 7 8 9 10 11 12", script)
        self.assertIn("rm -rf .next/cache", script)
        self.assertNotIn("rm -rf .next\n", script)
        self.assertNotIn("sync:attributes", script)

    def test_sync_attributes_runs_synchronously_after_healthcheck(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
            sync_attributes=True,
        )

        health_index = script.index("curl -fsS -m 30 http://127.0.0.1:3001/")
        sync_index = script.index("npm run sync:attributes")

        self.assertLess(health_index, sync_index)
        self.assertNotIn("nohup npm run sync:attributes", script)
        self.assertNotIn("audit:electrical", script)

    def test_run_audit_runs_synchronously_after_sync_attributes_with_markers(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
            sync_attributes=True,
            audit_script="audit:electrical",
        )

        sync_index = script.index("npm run sync:attributes")
        audit_start_index = script.index("===AUDIT-START===")
        audit_run_index = script.index("npm run audit:electrical")
        audit_end_index = script.index("===AUDIT-END===")

        self.assertLess(sync_index, audit_start_index)
        self.assertLess(audit_start_index, audit_run_index)
        self.assertLess(audit_run_index, audit_end_index)
        self.assertNotIn("nohup npm run audit:electrical", script)

    def test_run_audit_accepts_any_npm_script_name(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
            audit_script="audit:catalog",
        )

        self.assertIn("npm run audit:catalog", script)
        self.assertIn("climat-simf-audit-catalog-deploy.log", script)
        self.assertNotIn("audit:electrical", script)

    def test_full_clean_wipes_whole_next_instead_of_just_cache(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
            full_clean=True,
        )

        self.assertIn("rm -rf .next\n", script)
        self.assertNotIn("rm -rf .next/cache", script)

    def test_full_clean_stops_pm2_before_wiping_next_to_avoid_write_race(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
            full_clean=True,
        )

        stop_index = script.index("pm2 stop climat-simf-store")
        clean_index = script.index("rm -rf .next\n")
        self.assertLess(stop_index, clean_index)

    def test_default_clean_does_not_stop_pm2(self):
        script = build_remote_deploy_script(
            remote_root="/var/www/climat-simf.ru",
            process_name="climat-simf-store",
            build_log="/tmp/climat-build.log",
            run_install=False,
        )

        self.assertNotIn("pm2 stop", script)

    def test_connect_kwargs_support_key_auth_without_password(self):
        kwargs = build_connect_kwargs(
            host="212.116.115.150",
            user="root",
            key_path="C:/Users/user/.ssh/climat_simf_deploy",
            password=None,
        )

        self.assertEqual(kwargs["hostname"], "212.116.115.150")
        self.assertEqual(kwargs["username"], "root")
        self.assertEqual(kwargs["key_filename"], "C:/Users/user/.ssh/climat_simf_deploy")
        self.assertNotIn("password", kwargs)

    def test_remote_command_does_not_use_channel_read_timeout(self):
        client = _FakeClient()

        code, out, err = run_remote_command(client, "bash -lc true", timeout_seconds=30, poll_interval=0)

        self.assertEqual(code, 0)
        self.assertEqual(out, "ok")
        self.assertEqual(err, "")
        self.assertEqual(client.exec_command_kwargs, {})

    def test_printable_tail_replaces_characters_missing_from_console_encoding(self):
        self.assertEqual(printable_tail("ok ✓", encoding="cp1251"), "ok ?")

    def test_public_healthcheck_retries_transient_timeouts(self):
        calls = []

        def opener(url, timeout):
            calls.append((url, timeout))
            if len(calls) == 1:
                raise TimeoutError("cold start")
            return _FakeResponse(200)

        public_healthcheck(
            "https://climat-simf.ru",
            checks=["https://climat-simf.ru/"],
            attempts=2,
            timeout=90,
            delay=0,
            opener=opener,
        )

        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main()
