export interface FileRequest {
  action: "read_file" | "write_file" | "move_file" | "delete_file" | "list_dir" | "create_dir" | "zip_folder";
  path: string;
  destination?: string;
  content?: string;
}

export interface ProcessRequest {
  action: "run_script" | "launch_app" | "kill_process" | "list_processes";
  command?: string;
  app?: string;
  name?: string;
}

export interface ScreenRequest {
  action: "screenshot" | "click_at_coords" | "type_text" | "scroll" | "find_image_on_screen";
  x?: number;
  y?: number;
  text?: string;
  amount?: number;
  imagePath?: string;
}

export interface ScriptRequest {
  shell: "powershell" | "bash";
  command: string;
}
