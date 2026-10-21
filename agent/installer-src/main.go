package main

// WeAGENT.exe — самодостаточный установщик WeCRM Agent (Windows 10).
// Распаковывает встроенные файлы (agent.py, install.bat, Python 3.13 и пр.)
// в %ProgramFiles%\WeCRM Agent и запускает install.bat, передавая аргументы:
//   WeAGENT.exe [serverUrl] [contactId]

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
)

//go:embed files
var files embed.FS

func isAdmin() bool {
	// доступ к system-файлу есть только у администраторов
	f, err := os.Open(filepath.Join(os.Getenv("SystemRoot"), "System32", "config", "system"))
	if err != nil {
		return false
	}
	f.Close()
	return true
}

func extract(dir string) error {
	return fs.WalkDir(files, "files", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel("files", p)
		if err != nil {
			return err
		}
		dst := filepath.Join(dir, rel)
		if d.IsDir() {
			return os.MkdirAll(dst, 0o755)
		}
		data, err := files.ReadFile(p)
		if err != nil {
			return err
		}
		return os.WriteFile(dst, data, 0o644)
	})
}

func main() {
	fmt.Println("==========================================")
	fmt.Println(" WeAGENT - WeCRM Agent installer")
	fmt.Println("==========================================")
	fmt.Println()

	if !isAdmin() {
		fmt.Println("[ERROR] Administrator rights required.")
		fmt.Println("Right click WeAGENT.exe - Run as administrator.")
		fmt.Println()
		fmt.Print("Press Enter to exit...")
		fmt.Scanln()
		os.Exit(1)
	}

	dir := filepath.Join(os.Getenv("ProgramFiles"), "WeCRM Agent")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		fmt.Println("[ERROR] Cannot create", dir, ":", err)
		fmt.Print("Press Enter to exit...")
		fmt.Scanln()
		os.Exit(1)
	}
	fmt.Println("Extracting to", dir, "...")
	if err := extract(dir); err != nil {
		fmt.Println("[ERROR] Extract failed:", err)
		fmt.Print("Press Enter to exit...")
		fmt.Scanln()
		os.Exit(1)
	}

	args := []string{"/c", "install.bat"}
	args = append(args, os.Args[1:]...)
	cmd := exec.Command("cmd", args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	if err := cmd.Run(); err != nil {
		fmt.Println("[ERROR] install.bat failed:", err)
	}

	fmt.Println()
	fmt.Print("Press Enter to exit...")
	fmt.Scanln()
}
