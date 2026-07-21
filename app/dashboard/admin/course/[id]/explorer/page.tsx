import { notFound } from "next/navigation";

import { ExplorerPage } from "@/components/admin/explorer";

import {

    courseService,

    folderService,

} from "@/services";

export default async function Page({

    params,

}: {

    params: Promise<{ id: string }>;

}) {

    const { id } = await params;

    const course =
        await courseService.getCourseById(id);

    if (!course) {

        notFound();

    }

    const folders =
        await folderService.getFoldersByCourse(id);

    return (

        <ExplorerPage

            course={course}

            folders={folders}

        />

    );

}