#!/bin/bash
cd "$(dirname "$0")/icons"
python3 -c "
import struct, zlib

def create_png(size, filename):
    # Create a simple indigo (#6366f1) rounded square icon with white 'AI' text
    def make_row(y):
        row = bytearray([0])  # filter byte
        for x in range(size):
            # Coordinates relative to center
            cx = x - size / 2.0 + 0.5
            cy = y - size / 2.0 + 0.5
            half = size / 2.0
            corner_r = size * 0.2

            # Check if inside rounded rect
            inside = True
            for (ex, ey) in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
                inner_x = half - corner_r
                inner_y = half - corner_r
                if (cx * ex > inner_x) and (cy * ey > inner_y):
                    dx = abs(cx) - inner_x
                    dy = abs(cy) - inner_y
                    if (dx * dx + dy * dy) > corner_r * corner_r:
                        inside = False
                        break

            if not inside:
                row.extend([0, 0, 0, 0])  # transparent
                continue

            # Draw 'AI' text - simple bitmap approach
            is_text = False
            if size >= 48:
                # Normalized coordinates (0-1 range within the icon)
                nx = x / size
                ny = y / size

                # Letter A: centered around nx=0.28
                # Left leg
                if 0.15 < nx < 0.22 and 0.30 < ny < 0.72:
                    is_text = True
                # Right leg
                elif 0.32 < nx < 0.39 and 0.30 < ny < 0.72:
                    is_text = True
                # A top
                elif 0.20 < nx < 0.34 and 0.28 < ny < 0.36:
                    is_text = True
                # A crossbar
                elif 0.19 < nx < 0.36 and 0.48 < ny < 0.55:
                    is_text = True

                # Letter I: centered around nx=0.58
                # Vertical bar
                elif 0.56 < nx < 0.63 and 0.30 < ny < 0.72:
                    is_text = True
                # Top serif
                elif 0.50 < nx < 0.69 and 0.28 < ny < 0.36:
                    is_text = True
                # Bottom serif
                elif 0.50 < nx < 0.69 and 0.65 < ny < 0.72:
                    is_text = True

                # Shift everything right a bit for better centering
                is_text = False
                nx_shifted = nx - 0.05
                # Letter A
                if 0.15 < nx_shifted < 0.22 and 0.30 < ny < 0.72:
                    is_text = True
                elif 0.32 < nx_shifted < 0.39 and 0.30 < ny < 0.72:
                    is_text = True
                elif 0.20 < nx_shifted < 0.34 and 0.28 < ny < 0.36:
                    is_text = True
                elif 0.19 < nx_shifted < 0.36 and 0.48 < ny < 0.55:
                    is_text = True
                # Letter I
                elif 0.56 < nx_shifted < 0.63 and 0.30 < ny < 0.72:
                    is_text = True
                elif 0.50 < nx_shifted < 0.69 and 0.28 < ny < 0.36:
                    is_text = True
                elif 0.50 < nx_shifted < 0.69 and 0.65 < ny < 0.72:
                    is_text = True

            elif size == 16:
                # Simpler text for 16x16
                # A: columns 2-6, rows 4-12
                # Left leg
                if x in [3, 4] and 5 <= y <= 12:
                    is_text = True
                elif x in [8, 9] and 5 <= y <= 12:
                    is_text = True
                elif 4 <= x <= 8 and y in [4, 5]:
                    is_text = True
                elif 3 <= x <= 9 and y in [8, 9]:
                    is_text = True
                # I
                elif x in [11, 12] and 5 <= y <= 12:
                    is_text = True
                elif 10 <= x <= 13 and y in [4, 5]:
                    is_text = True
                elif 10 <= x <= 13 and y in [11, 12]:
                    is_text = True

            if is_text:
                row.extend([255, 255, 255, 255])  # white
            else:
                row.extend([99, 102, 241, 255])  # #6366f1

        return bytes(row)

    raw = b''.join(make_row(y) for y in range(size))

    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)
    print(f'Created {filename} ({size}x{size})')

create_png(16, 'icon16.png')
create_png(48, 'icon48.png')
create_png(128, 'icon128.png')
"
echo "Icons generated!"
