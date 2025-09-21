# Copyright (c) 2023 PaddlePaddle Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sys
import shutil
import requests
import zipfile
import tarfile
import hashlib
from pathlib import Path
from urllib.parse import urlparse

from . import logging

__all__ = ['CACHE_DIR', 'get_path_from_url', 'get_path_from_url_with_md5']

# Define a writable cache directory in the Lambda environment
CACHE_DIR = '/tmp/.paddlex_cache'
TEMP_DIR = '/tmp/.paddlex_tmp'


def get_path_from_url_with_md5(url, md5):
    path = get_path_from_url(url, CACHE_DIR)
    if not os.path.exists(path) or not _check_md5(path, md5):
        if os.path.exists(path):
            os.remove(path)
        _download(url, path)
        if not _check_md5(path, md5):
            raise RuntimeError(
                "The MD5 check of downloaded file failed. Please check the file or network environment."
            )
    return path


def get_path_from_url(url, root_dir=None):
    """ Download from given url to root_dir.
        if file or directory specified by url is exists under root_dir, return the path directly,
        otherwise download from url and decompress it, return the path.

    Args:
        url (str): url
        root_dir (str): root_dir
    Returns:
        str: a local path to save data
    """
    if root_dir is None:
        root_dir = CACHE_DIR

    # parse url to get filename
    url_path = urlparse(url).path
    filename = os.path.basename(url_path)

    # make sure root_dir exists
    if not os.path.exists(root_dir):
        os.makedirs(root_dir)

    filepath = os.path.join(root_dir, filename)
    if os.path.exists(filepath):
        logging.info(f"Found {filepath}, now skip downloading.")
    else:
        # download
        logging.info(f"Connecting to {url} to download {filename}...")
        _download(url, filepath)
        logging.info(f"Downloaded {filename} which resolves to {filepath}.")

    # decompress
    if _is_zip_file(filepath):
        filepath = _unzip_file(filepath, root_dir)
    elif _is_tar_file(filepath):
        filepath = _untar_file(filepath, root_dir)

    return filepath


class TempFileManager(object):
    def __init__(self):
        self.pid = os.getpid()
        self.temp_dir = os.path.join(TEMP_DIR, str(self.pid))
        Path(self.temp_dir).mkdir(parents=True, exist_ok=True)

    def get_temp_path(self, path):
        return os.path.join(self.temp_dir, path)

    def clear(self):
        shutil.rmtree(self.temp_dir)


temp_file_manager = TempFileManager()


def _is_zip_file(path):
    return zipfile.is_zipfile(path)

def _is_tar_file(path):
    return tarfile.is_tarfile(path)

def _unzip_file(path, root_dir):
    files = zipfile.ZipFile(path, 'r')
    file_list = files.namelist()
    # extract files to root_dir
    files.extractall(root_dir)
    files.close()
    # get extracted path
    if len(file_list) == 1 and file_list[0].endswith('/'):
        # a directory
        extracted_path = os.path.join(root_dir, file_list[0])
    else:
        # a file
        extracted_path = os.path.join(root_dir, os.path.dirname(file_list[0]))
    return extracted_path

def _untar_file(path, root_dir):
    files = tarfile.open(path)
    # extract files to root_dir
    files.extractall(root_dir)
    files.close()
    # get extracted path
    extracted_path = os.path.join(root_dir, files.getnames()[0])
    if os.path.isdir(extracted_path):
        return extracted_path
    else:
        return os.path.dirname(extracted_path)

def _download(url, path):
    # create a temp file to download
    temp_path = temp_file_manager.get_temp_path(os.path.basename(path))
    # request
    r = requests.get(url, stream=True)
    total_length = r.headers.get('content-length')
    # download
    with open(temp_path, 'wb') as f:
        if total_length is None:
            f.write(r.content)
        else:
            dl = 0
            total_length = int(total_length)
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    dl += len(chunk)
                    f.write(chunk)
                    # progress bar
                    done = int(50 * dl / total_length)
                    sys.stdout.write(f"\r['{'=' * done}{' ' * (50 - done)}]")
                    sys.stdout.flush()
    # move temp file to path
    shutil.move(temp_path, path)

def _check_md5(path, md5):
    if not os.path.exists(path):
        return False
    with open(path, 'rb') as f:
        # read file in chunk
        chunk_size = 1024 * 1024
        while True:
            data = f.read(chunk_size)
            if not data:
                break
            # update md5
            md5_obj = hashlib.md5()
            md5_obj.update(data)
        if md5_obj.hexdigest() == md5:
            return True
        else:
            return False
