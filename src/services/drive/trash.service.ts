import { StorageTypes, Trash } from '@internxt/sdk/dist/drive';
import { SdkManager } from '../sdk-manager.service';
import { FetchPaginatedFile, FetchPaginatedFolder } from '@internxt/sdk/dist/drive/storage/types';

export class TrashService {
  static readonly instance = new TrashService();

  public trashItems = (payload: StorageTypes.AddItemsToTrashPayload) => {
    const storageClient = SdkManager.instance.getStorage(true);
    return storageClient.addItemsToTrash(payload);
  };

  public deleteFile = (payload: StorageTypes.DeleteFilePayload) => {
    const storageClient = SdkManager.instance.getStorage(false);
    return storageClient.deleteFile(payload);
  };

  public deleteFolder = (folderId: number) => {
    const storageClient = SdkManager.instance.getStorage(false);
    return storageClient.deleteFolder(folderId);
  };

  public clearTrash = () => {
    const storageClient = SdkManager.instance.getTrash();
    return storageClient.clearTrash();
  };

  public getTrashFolderContent = async () => {
    const storageClient = SdkManager.instance.getTrash();
    const folders = await this.getAllTrashSubfolders(storageClient, 0);
    const files = await this.getAllTrashSubfiles(storageClient, 0);
    return { folders, files };
  };

  private getAllTrashSubfolders = async (storageClient: Trash, offset: number): Promise<FetchPaginatedFolder[]> => {
    const folderContentPromise = storageClient.getTrashedFilesPaginated(50, offset, 'folders', true);
    const { result: folders } = (await folderContentPromise) as unknown as { result: FetchPaginatedFolder[] };

    if (folders.length > 0) {
      return folders.concat(await this.getAllTrashSubfolders(storageClient, offset + folders.length));
    } else {
      return folders;
    }
  };

  private getAllTrashSubfiles = async (storageClient: Trash, offset: number): Promise<FetchPaginatedFile[]> => {
    const folderContentPromise = storageClient.getTrashedFilesPaginated(50, offset, 'files', true);
    const { result: folders } = (await folderContentPromise) as unknown as { result: FetchPaginatedFile[] };

    if (folders.length > 0) {
      return folders.concat(await this.getAllTrashSubfiles(storageClient, offset + folders.length));
    } else {
      return folders;
    }
  };
}
