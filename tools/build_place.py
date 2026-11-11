#!/usr/bin/env python3
"""Builds NightfallRunners.rbxlx from src/ so you can open it straight in Roblox Studio
(no Rojo needed). Usage: python3 tools/build_place.py"""
import os
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref = 0

def next_ref():
    global ref
    ref += 1
    return f"RBX{ref:08X}"

def cdata(src):
    return "<![CDATA[" + src.replace("]]>", "]]]]><![CDATA[>") + "]]>"

def script_item(path):
    name = os.path.basename(path)
    if name.endswith(".server.lua"):
        cls, name = "Script", name[:-len(".server.lua")]
    elif name.endswith(".client.lua"):
        cls, name = "LocalScript", name[:-len(".client.lua")]
    else:
        cls, name = "ModuleScript", name[:-len(".lua")]
    with open(path, encoding="utf-8") as f:
        src = f.read()
    return (f'<Item class="{cls}" referent="{next_ref()}"><Properties>'
            f'<string name="Name">{escape(name)}</string>'
            f'<ProtectedString name="Source">{cdata(src)}</ProtectedString>'
            f'</Properties></Item>')

def folder(name, directory):
    kids = "".join(script_item(os.path.join(directory, f))
                   for f in sorted(os.listdir(directory)) if f.endswith(".lua"))
    return (f'<Item class="Folder" referent="{next_ref()}"><Properties>'
            f'<string name="Name">{name}</string></Properties>{kids}</Item>')

def service(cls, children=""):
    return (f'<Item class="{cls}" referent="{next_ref()}"><Properties>'
            f'<string name="Name">{cls}</string></Properties>{children}</Item>')

src = os.path.join(ROOT, "src")
body = (
    service("Workspace")
    + service("ReplicatedStorage", folder("Shared", os.path.join(src, "shared")))
    + service("ServerScriptService", folder("Server", os.path.join(src, "server")))
    + service("StarterPlayer", service("StarterPlayerScripts", folder("Client", os.path.join(src, "client"))))
)
xml = ('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
       'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
       'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">'
       '<External>null</External><External>nil</External>' + body + '</roblox>')
out = os.path.join(ROOT, "NightfallRunners.rbxlx")
with open(out, "w", encoding="utf-8") as f:
    f.write(xml)
print("Wrote", out)
